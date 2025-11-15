use crate::error::Error::{RenderStackExceededError, VariableNotFound};
use crate::error::Result;
use crate::{Parser, Token, Tokens, Val};
use log::warn;
use serde_json::json;
use std::collections::HashMap;
use std::future::Future;

const MAX_DEPTH: usize = 50;

pub trait TemplateCallback {
    fn run(
        &self,
        fn_name: &str,
        args: HashMap<String, serde_json::Value>,
    ) -> impl Future<Output = Result<String>> + Send;

    fn transform_arg(&self, fn_name: &str, arg_name: &str, arg_value: &str) -> Result<String>;
}

pub async fn render_json_value_raw<T: TemplateCallback>(
    v: serde_json::Value,
    vars: &HashMap<String, String>,
    cb: &T,
    opt: &RenderOptions,
) -> Result<serde_json::Value> {
    let v = match v {
        serde_json::Value::String(s) => json!(parse_and_render(&s, vars, cb, opt).await?),
        serde_json::Value::Array(a) => {
            let mut new_a = Vec::new();
            for v in a {
                new_a.push(Box::pin(render_json_value_raw(v, vars, cb, opt)).await?)
            }
            json!(new_a)
        }
        serde_json::Value::Object(o) => {
            let mut new_o = serde_json::Map::new();
            for (k, v) in o {
                let key = Box::pin(parse_and_render(&k, vars, cb, opt)).await?;
                let value = Box::pin(render_json_value_raw(v, vars, cb, opt)).await?;
                new_o.insert(key, value);
            }
            json!(new_o)
        }
        v => v,
    };
    Ok(v)
}

async fn parse_and_render_at_depth<T: TemplateCallback>(
    template: &str,
    vars: &HashMap<String, String>,
    cb: &T,
    opt: &RenderOptions,
    depth: usize,
) -> Result<String> {
    let mut p = Parser::new(template);
    let tokens = p.parse()?;
    render(tokens, vars, cb, opt, depth + 1).await
}

pub async fn parse_and_render<T: TemplateCallback>(
    template: &str,
    vars: &HashMap<String, String>,
    cb: &T,
    opt: &RenderOptions,
) -> Result<String> {
    parse_and_render_at_depth(template, vars, cb, opt, 1).await
}

#[derive(PartialEq)]
pub enum RenderErrorBehavior {
    Throw,
    ReturnEmpty,
}

pub struct RenderOptions {
    pub error_behavior: RenderErrorBehavior,
}

impl RenderErrorBehavior {
    pub fn handle(&self, r: Result<String>) -> Result<String> {
        match (self, r) {
            (_, Ok(v)) => Ok(v),
            (RenderErrorBehavior::Throw, Err(e)) => Err(e),
            (RenderErrorBehavior::ReturnEmpty, Err(e)) => {
                warn!("Error rendering string: {}", e);
                Ok("".to_string())
            }
        }
    }
}

pub async fn render<T: TemplateCallback>(
    tokens: Tokens,
    vars: &HashMap<String, String>,
    cb: &T,
    opt: &RenderOptions,
    mut depth: usize,
) -> Result<String> {
    depth += 1;
    if depth > MAX_DEPTH {
        return opt.error_behavior.handle(Err(RenderStackExceededError));
    }

    let mut doc_str: Vec<String> = Vec::new();

    for t in tokens.tokens {
        match t {
            Token::Raw { text } => doc_str.push(text),
            Token::Tag { val } => {
                let val = render_value(val, &vars, cb, opt, depth).await;
                doc_str.push(opt.error_behavior.handle(val)?)
            }
            Token::Eof => {}
        }
    }

    Ok(doc_str.join(""))
}

async fn render_value<T: TemplateCallback>(
    val: Val,
    vars: &HashMap<String, String>,
    cb: &T,
    opt: &RenderOptions,
    depth: usize,
) -> Result<String> {
    let v = match val {
        Val::Str { text } => {
            let r = Box::pin(parse_and_render_at_depth(&text, vars, cb, opt, depth)).await?;
            r.to_string()
        }
        Val::Var { name } => match vars.get(name.as_str()) {
            Some(v) => {
                let r = Box::pin(parse_and_render_at_depth(v, vars, cb, opt, depth)).await?;
                r.to_string()
            }
            None => return Err(VariableNotFound(name)),
        },
        Val::Fn { name, args } => {
            let mut resolved_args: HashMap<String, serde_json::Value> = HashMap::new();
            for a in args {
                let v = match a.value.clone() {
                    Val::Bool { value } => serde_json::Value::Bool(value),
                    Val::Null => serde_json::Value::Null,
                    _ => serde_json::Value::String(
                        Box::pin(render_value(a.value, vars, cb, opt, depth)).await?,
                    ),
                };
                resolved_args.insert(a.name, v);
            }
            let result = cb.run(name.as_str(), resolved_args.clone()).await?;
            Box::pin(parse_and_render_at_depth(&result, vars, cb, opt, depth)).await?
        }
        Val::Bool { value } => value.to_string(),
        Val::Null => "".into(),
    };

    Ok(v)
}

#[cfg(test)]
mod parse_and_render_tests {
    use crate::error::Error::{RenderError, RenderStackExceededError, VariableNotFound};
    use crate::error::Result;
    use crate::renderer::TemplateCallback;
    use crate::*;
    use std::collections::HashMap;

    struct EmptyCB {}

    impl TemplateCallback for EmptyCB {
        async fn run(
            &self,
            _fn_name: &str,
            _args: HashMap<String, serde_json::Value>,
        ) -> Result<String> {
            todo!()
        }

        fn transform_arg(
            &self,
            _fn_name: &str,
            _arg_name: &str,
            arg_value: &str,
        ) -> Result<String> {
            Ok(arg_value.to_string())
        }
    }

    #[tokio::test]
    async fn render_empty() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "";
        let vars = HashMap::new();
        let result = "";
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(parse_and_render(template, &vars, &empty_cb, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_text_only() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "Hello World!";
        let vars = HashMap::new();
        let result = "Hello World!";
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(parse_and_render(template, &vars, &empty_cb, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_simple() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "${[ foo ]}";
        let vars = HashMap::from([("foo".to_string(), "bar".to_string())]);
        let result = "bar";
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(parse_and_render(template, &vars, &empty_cb, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_recursive_var() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "${[ foo ]}";
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "foo: ${[ bar ]}".to_string());
        vars.insert("bar".to_string(), "bar: ${[ baz ]}".to_string());
        vars.insert("baz".to_string(), "baz".to_string());

        let result = "foo: bar: baz";
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(parse_and_render(template, &vars, &empty_cb, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_missing_var() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "${[ foo ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(
            parse_and_render(template, &vars, &empty_cb, &opt).await,
            Err(VariableNotFound("foo".to_string()))
        );
        Ok(())
    }

    #[tokio::test]
    async fn render_empty_var() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "${[ foo ]}";
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(
            parse_and_render(template, &vars, &empty_cb, &opt).await,
            Ok("".to_string())
        );
        Ok(())
    }

    #[tokio::test]
    async fn render_self_referencing_var() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "${[ foo ]}";
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "${[ foo ]}".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(
            parse_and_render(template, &vars, &empty_cb, &opt).await,
            Err(RenderStackExceededError)
        );
        Ok(())
    }

    #[tokio::test]
    async fn render_surrounded() -> Result<()> {
        let empty_cb = EmptyCB {};
        let template = "hello ${[ word ]} world!";
        let vars = HashMap::from([("word".to_string(), "cruel".to_string())]);
        let result = "hello cruel world!";
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        assert_eq!(parse_and_render(template, &vars, &empty_cb, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_valid_fn() -> Result<()> {
        let vars = HashMap::new();
        let template = r#"${[ say_hello(a='John', b='Kate') ]}"#;
        let result = r#"say_hello: 2, Some(String("John")) Some(String("Kate"))"#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(format!("{fn_name}: {}, {:?} {:?}", args.len(), args.get("a"), args.get("b")))
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                arg_value: &str,
            ) -> Result<String> {
                Ok(arg_value.to_string())
            }
        }
        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result);
        Ok(())
    }

    #[tokio::test]
    async fn render_fn_arg() -> Result<()> {
        let vars = HashMap::new();
        let template = r#"${[ upper(foo='bar') ]}"#;
        let result = r#""BAR""#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(match fn_name {
                    "secret" => "abc".to_string(),
                    "upper" => args["foo"].to_string().to_uppercase(),
                    _ => "".to_string(),
                })
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                _arg_value: &str,
            ) -> Result<String> {
                todo!()
            }
        }

        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_fn_b64_arg_template() -> Result<()> {
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "bar".to_string());
        let template = r#"${[ upper(foo=b64'Zm9vICdiYXInIGJheg') ]}"#;
        let result = r#""FOO 'BAR' BAZ""#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(match fn_name {
                    "upper" => args["foo"].to_string().to_uppercase(),
                    _ => "".to_string(),
                })
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                _arg_value: &str,
            ) -> Result<String> {
                todo!()
            }
        }

        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_fn_arg_template() -> Result<()> {
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "bar".to_string());
        let template = r#"${[ upper(foo='${[ foo ]}') ]}"#;
        let result = r#""BAR""#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(match fn_name {
                    "secret" => "abc".to_string(),
                    "upper" => args["foo"].to_string().to_uppercase(),
                    _ => "".to_string(),
                })
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                _arg_value: &str,
            ) -> Result<String> {
                todo!()
            }
        }

        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_fn_return_template() -> Result<()> {
        let mut vars = HashMap::new();
        vars.insert("foo".to_string(), "bar".to_string());
        let template = r#"${[ no_op(inner='${[ foo ]}') ]}"#;
        let result = r#""bar""#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(match fn_name {
                    "no_op" => args["inner"].to_string(),
                    _ => "".to_string(),
                })
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                _arg_value: &str,
            ) -> Result<String> {
                todo!()
            }
        }

        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_nested_fn() -> Result<()> {
        let vars = HashMap::new();
        let template = r#"${[ upper(foo=secret()) ]}"#;
        let result = r#""ABC""#;

        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };
        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                fn_name: &str,
                args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Ok(match fn_name {
                    "secret" => "abc".to_string(),
                    "upper" => args["foo"].to_string().to_uppercase(),
                    _ => "".to_string(),
                })
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                arg_value: &str,
            ) -> Result<String> {
                Ok(arg_value.to_string())
            }
        }
        assert_eq!(parse_and_render(template, &vars, &CB {}, &opt).await?, result.to_string());
        Ok(())
    }

    #[tokio::test]
    async fn render_fn_err() -> Result<()> {
        let vars = HashMap::new();
        let template = r#"hello ${[ error() ]}"#;
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        struct CB {}
        impl TemplateCallback for CB {
            async fn run(
                &self,
                _fn_name: &str,
                _args: HashMap<String, serde_json::Value>,
            ) -> Result<String> {
                Err(RenderError("Failed to do it!".to_string()))
            }

            fn transform_arg(
                &self,
                _fn_name: &str,
                _arg_name: &str,
                arg_value: &str,
            ) -> Result<String> {
                Ok(arg_value.to_string())
            }
        }

        assert_eq!(
            parse_and_render(template, &vars, &CB {}, &opt).await,
            Err(RenderError("Failed to do it!".to_string()))
        );
        Ok(())
    }
}

#[cfg(test)]
mod render_json_value_raw_tests {
    use crate::error::Result;
    use crate::{
        RenderErrorBehavior, RenderOptions, TemplateCallback, parse_and_render,
        render_json_value_raw,
    };
    use serde_json::json;
    use std::collections::HashMap;

    struct EmptyCB {}

    impl TemplateCallback for EmptyCB {
        async fn run(
            &self,
            _fn_name: &str,
            _args: HashMap<String, serde_json::Value>,
        ) -> Result<String> {
            todo!()
        }

        fn transform_arg(
            &self,
            _fn_name: &str,
            _arg_name: &str,
            arg_value: &str,
        ) -> Result<String> {
            Ok(arg_value.to_string())
        }
    }

    #[tokio::test]
    async fn render_json_value_string() -> Result<()> {
        let v = json!("${[a]}");
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), "aaa".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        assert_eq!(render_json_value_raw(v, &vars, &EmptyCB {}, &opt).await?, json!("aaa"));
        Ok(())
    }

    #[tokio::test]
    async fn render_json_value_array() -> Result<()> {
        let v = json!(["${[a]}", "${[a]}"]);
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), "aaa".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = render_json_value_raw(v, &vars, &EmptyCB {}, &opt).await?;
        assert_eq!(result, json!(["aaa", "aaa"]));

        Ok(())
    }

    #[tokio::test]
    async fn render_json_value_object() -> Result<()> {
        let v = json!({"${[a]}": "${[a]}"});
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), "aaa".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = render_json_value_raw(v, &vars, &EmptyCB {}, &opt).await?;
        assert_eq!(result, json!({"aaa": "aaa"}));

        Ok(())
    }

    #[tokio::test]
    async fn render_json_value_nested() -> Result<()> {
        let v = json!([
            123,
            {"${[a]}": "${[a]}"},
            null,
            "${[a]}",
            false,
            {"x": ["${[a]}"]}
        ]);
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), "aaa".to_string());
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = render_json_value_raw(v, &vars, &EmptyCB {}, &opt).await?;
        assert_eq!(
            result,
            json!([
                123,
                {"aaa": "aaa"},
                null,
                "aaa",
                false,
                {"x": ["aaa"]}
            ])
        );

        Ok(())
    }

    #[tokio::test]
    async fn render_opt_return_empty() -> Result<()> {
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::ReturnEmpty,
        };

        let result = parse_and_render("DNE: ${[hello]}", &vars, &EmptyCB {}, &opt).await?;
        assert_eq!(result, "DNE: ".to_string());

        Ok(())
    }
}

// ============================================================================
// Workflow Template Support
// ============================================================================

/// Context for workflow execution containing previous step responses
#[derive(Debug, Clone)]
pub struct WorkflowContext {
    step_responses: Vec<StepResponse>,
    loop_context: Option<LoopContext>,
    conditional_branch: Option<String>,
}

/// Response data from a single workflow step
#[derive(Debug, Clone)]
pub struct StepResponse {
    pub response_body: serde_json::Value,
    pub response_headers: HashMap<String, String>,
    pub response_status: i32,
    pub response_elapsed: i32,
    pub response_url: String,
}

/// Context for loop execution (mirrors workflow execution context)
#[derive(Debug, Clone)]
pub struct LoopContext {
    pub index: usize,
    pub total: usize,
    pub item: Option<serde_json::Value>,
}

impl WorkflowContext {
    pub fn new() -> Self {
        Self {
            step_responses: Vec::new(),
            loop_context: None,
            conditional_branch: None,
        }
    }

    pub fn add_step_response(&mut self, response: StepResponse) {
        self.step_responses.push(response);
    }

    pub fn get_step_response(&self, index: usize) -> Option<&StepResponse> {
        self.step_responses.get(index)
    }

    pub fn set_loop_context(&mut self, context: LoopContext) {
        self.loop_context = Some(context);
    }

    pub fn clear_loop_context(&mut self) {
        self.loop_context = None;
    }

    pub fn get_loop_context(&self) -> Option<&LoopContext> {
        self.loop_context.as_ref()
    }

    pub fn set_conditional_branch(&mut self, branch: String) {
        self.conditional_branch = Some(branch);
    }

    pub fn get_conditional_branch(&self) -> Option<&String> {
        self.conditional_branch.as_ref()
    }

    pub fn len(&self) -> usize {
        self.step_responses.len()
    }

    pub fn is_empty(&self) -> bool {
        self.step_responses.is_empty()
    }
}

impl Default for WorkflowContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse and render template with workflow context support
pub async fn parse_and_render_with_workflow<T: TemplateCallback>(
    text: &str,
    vars: &HashMap<String, String>,
    workflow_ctx: Option<&WorkflowContext>,
    cb: &T,
    opt: &RenderOptions,
) -> Result<String> {
    let tokens = Parser::new(text).parse()?;
    render_with_workflow(&tokens, vars, workflow_ctx, cb, opt, 0).await
}

/// Render JSON value with workflow context
pub async fn render_json_value_raw_with_workflow<T: TemplateCallback>(
    v: serde_json::Value,
    vars: &HashMap<String, String>,
    workflow_ctx: Option<&WorkflowContext>,
    cb: &T,
    opt: &RenderOptions,
) -> Result<serde_json::Value> {
    let v = match v {
        serde_json::Value::String(s) => {
            json!(parse_and_render_with_workflow(&s, vars, workflow_ctx, cb, opt).await?)
        }
        serde_json::Value::Array(a) => {
            let mut new_a = Vec::new();
            for v in a {
                new_a.push(
                    Box::pin(render_json_value_raw_with_workflow(v, vars, workflow_ctx, cb, opt))
                        .await?,
                );
            }
            json!(new_a)
        }
        serde_json::Value::Object(o) => {
            let mut new_o = serde_json::Map::new();
            for (k, v) in o {
                let key =
                    Box::pin(parse_and_render_with_workflow(&k, vars, workflow_ctx, cb, opt))
                        .await?;
                let value =
                    Box::pin(render_json_value_raw_with_workflow(v, vars, workflow_ctx, cb, opt))
                        .await?;
                new_o.insert(key, value);
            }
            json!(new_o)
        }
        v => v,
    };
    Ok(v)
}

/// Core render function with workflow support
async fn render_with_workflow<T: TemplateCallback>(
    tokens: &Tokens,
    vars: &HashMap<String, String>,
    workflow_ctx: Option<&WorkflowContext>,
    cb: &T,
    opt: &RenderOptions,
    depth: usize,
) -> Result<String> {
    if depth >= MAX_DEPTH {
        return Err(RenderStackExceededError);
    }

    let mut result = String::new();
    for token in &tokens.tokens {
        let rendered = match token {
            Token::Raw { text } => text.clone(),
            Token::Tag { val } => match val {
                Val::Str { text } => text.clone(),
                Val::Var { name } => {
                    Box::pin(render_value_with_workflow(name, vars, workflow_ctx, cb, opt, depth)).await?
                }
                Val::Bool { value } => value.to_string(),
                Val::Fn { name, args } => {
                    let mut fn_args = HashMap::new();
                    for arg in args {
                        let arg_val_str = Box::pin(render_with_workflow(&Tokens { tokens: vec![Token::Tag { val: arg.value.clone() }] }, vars, workflow_ctx, cb, opt, depth + 1)).await?;
                        let arg_val_transformed = cb.transform_arg(name, &arg.name, &arg_val_str)?;
                        fn_args.insert(arg.name.to_string(), json!(arg_val_transformed));
                    }
                    cb.run(name, fn_args).await?
                }
                Val::Null => String::new(),
            },
            Token::Eof => String::new(),
        };
        result.push_str(&rendered);
    }
    Ok(result)
}

/// Render variable value with workflow support
async fn render_value_with_workflow<T: TemplateCallback>(
    name: &str,
    vars: &HashMap<String, String>,
    workflow_ctx: Option<&WorkflowContext>,
    cb: &T,
    opt: &RenderOptions,
    depth: usize,
) -> Result<String> {
    // Check if it's a workflow variable
    if let Some(wf_ctx) = workflow_ctx {
        if name.starts_with("workflow.") {
            return resolve_workflow_variable(name, wf_ctx);
        }
        if name.starts_with("loop.") {
            return resolve_loop_variable(name, wf_ctx);
        }
        if name.starts_with("conditional.") {
            return resolve_conditional_variable(name, wf_ctx);
        }
    }

    // Fallback to regular variable resolution
    match vars.get(name) {
        Some(v) => {
            let tokens = Parser::new(v).parse()?;
            Box::pin(render_with_workflow(&tokens, vars, workflow_ctx, cb, opt, depth + 1)).await
        }
        None => {
            if opt.error_behavior == RenderErrorBehavior::Throw {
                Err(VariableNotFound(name.to_string()))
            } else {
                warn!("Variable not found: {}", name);
                Ok(format!("{{{{{}}}}}", name))
            }
        }
    }
}

/// Resolve workflow template variables
/// Syntax: workflow.step[N].response.body.field
/// Examples:
///   - workflow.step[0].response.body.token
///   - workflow.step[0].response.headers.Authorization
///   - workflow.step[0].response.status
///   - workflow.step[1].response.body.user.email
fn resolve_workflow_variable(path: &str, workflow_ctx: &WorkflowContext) -> Result<String> {
    // Parse: workflow.step[N].rest.of.path
    let re = regex::Regex::new(r"^workflow\.step\[(\d+)\]\.(.+)$").map_err(|e| {
        crate::error::Error::WorkflowInvalidSyntax(format!("Invalid workflow variable regex: {}", e))
    })?;

    let caps = re.captures(path).ok_or_else(|| {
        crate::error::Error::WorkflowInvalidSyntax(format!("Invalid workflow variable syntax: {}", path))
    })?;

    let step_index: usize = caps[1].parse().map_err(|e| {
        crate::error::Error::WorkflowInvalidSyntax(format!("Invalid step index: {}", e))
    })?;

    let field_path = &caps[2];

    // Get step response
    let step_response = workflow_ctx
        .get_step_response(step_index)
        .ok_or_else(|| crate::error::Error::WorkflowStepNotExecuted(step_index))?;

    // Resolve nested field
    resolve_nested_field(field_path, step_response, step_index)
}

/// Resolve nested field from step response
fn resolve_nested_field(path: &str, response: &StepResponse, step_index: usize) -> Result<String> {
    // Handle special response fields
    if path == "response.status" {
        return Ok(response.response_status.to_string());
    }
    if path == "response.elapsed" {
        return Ok(response.response_elapsed.to_string());
    }
    if path == "response.url" {
        return Ok(response.response_url.clone());
    }

    // Handle response.headers.HeaderName
    if let Some(header_name) = path.strip_prefix("response.headers.") {
        return response
            .response_headers
            .get(header_name)
            .cloned()
            .ok_or_else(|| crate::error::Error::WorkflowHeaderNotFound(header_name.to_string(), step_index));
    }

    // Handle response.body.field.nested.path
    if let Some(body_path) = path.strip_prefix("response.body") {
        let body_path = body_path.trim_start_matches('.');
        return extract_json_field(&response.response_body, body_path, step_index);
    }

    // Unknown field
    Err(crate::error::Error::WorkflowFieldNotFound(path.to_string(), step_index))
}

/// Extract field from JSON using dot notation
fn extract_json_field(json: &serde_json::Value, path: &str, step_index: usize) -> Result<String> {
    if path.is_empty() {
        // Return entire body as string
        return Ok(serde_json::to_string(json).unwrap_or_else(|_| "null".to_string()));
    }

    let parts: Vec<&str> = path.split('.').collect();
    let mut current = json;

    for part in parts {
        match current {
            serde_json::Value::Object(map) => {
                current = map.get(part).ok_or_else(|| {
                    crate::error::Error::WorkflowFieldNotFound(format!("response.body.{}", path), step_index)
                })?;
            }
            serde_json::Value::Array(arr) => {
                // Try to parse as array index
                let index: usize = part.parse().map_err(|_| {
                    crate::error::Error::WorkflowFieldNotFound(format!("response.body.{}", path), step_index)
                })?;
                current = arr.get(index).ok_or_else(|| {
                    crate::error::Error::WorkflowFieldNotFound(format!("response.body.{}", path), step_index)
                })?;
            }
            _ => {
                return Err(crate::error::Error::WorkflowFieldNotFound(
                    format!("response.body.{}", path),
                    step_index,
                ));
            }
        }
    }

    // Convert final value to string
    let result = match current {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Null => "null".to_string(),
        _ => serde_json::to_string(current).unwrap_or_else(|_| "null".to_string()),
    };

    Ok(result)
}

/// Resolve loop template variables
/// Syntax: loop.index, loop.total, loop.item.field
/// Examples:
///   - loop.index  - Current iteration index (0-based)
///   - loop.total  - Total number of iterations
///   - loop.item   - Current item being processed
///   - loop.item.name - Field from current item (if item is object)
fn resolve_loop_variable(path: &str, workflow_ctx: &WorkflowContext) -> Result<String> {
    let loop_ctx = workflow_ctx
        .get_loop_context()
        .ok_or_else(|| crate::error::Error::WorkflowInvalidSyntax(
            "Loop context not available (not inside a loop)".to_string()
        ))?;

    // Extract field after "loop."
    let field = path
        .strip_prefix("loop.")
        .ok_or_else(|| crate::error::Error::WorkflowInvalidSyntax(
            format!("Invalid loop variable syntax: {}", path)
        ))?;

    match field {
        "index" => Ok(loop_ctx.index.to_string()),
        "total" => Ok(loop_ctx.total.to_string()),
        "item" => {
            // Return entire item as JSON string
            match &loop_ctx.item {
                Some(item) => Ok(serde_json::to_string(item).unwrap_or_else(|_| "null".to_string())),
                None => Ok("null".to_string()),
            }
        }
        _ if field.starts_with("item.") => {
            // Extract nested field from item (e.g., loop.item.name)
            let item_field = field.strip_prefix("item.").unwrap();
            match &loop_ctx.item {
                Some(item) => extract_json_field_simple(item, item_field),
                None => Err(crate::error::Error::WorkflowInvalidSyntax(
                    "Loop item is null".to_string()
                )),
            }
        }
        _ => Err(crate::error::Error::WorkflowInvalidSyntax(
            format!("Unknown loop variable: {}", field)
        )),
    }
}

/// Resolve conditional template variables
/// Syntax: conditional.branch
/// Examples:
///   - conditional.branch - Name of the branch that was taken (e.g., "success", "error")
fn resolve_conditional_variable(path: &str, workflow_ctx: &WorkflowContext) -> Result<String> {
    if path != "conditional.branch" {
        return Err(crate::error::Error::WorkflowInvalidSyntax(
            format!("Invalid conditional variable syntax: {}", path)
        ));
    }

    workflow_ctx
        .get_conditional_branch()
        .cloned()
        .ok_or_else(|| crate::error::Error::WorkflowInvalidSyntax(
            "Conditional context not available (not inside a conditional branch)".to_string()
        ))
}

/// Extract field from JSON using dot notation (simplified version without step context)
fn extract_json_field_simple(json: &serde_json::Value, path: &str) -> Result<String> {
    if path.is_empty() {
        return Ok(serde_json::to_string(json).unwrap_or_else(|_| "null".to_string()));
    }

    let parts: Vec<&str> = path.split('.').collect();
    let mut current = json;

    for part in parts {
        match current {
            serde_json::Value::Object(map) => {
                current = map.get(part).ok_or_else(|| {
                    crate::error::Error::WorkflowFieldNotFound(format!("{}", path), 0)
                })?;
            }
            serde_json::Value::Array(arr) => {
                let index: usize = part.parse().map_err(|_| {
                    crate::error::Error::WorkflowFieldNotFound(format!("{}", path), 0)
                })?;
                current = arr.get(index).ok_or_else(|| {
                    crate::error::Error::WorkflowFieldNotFound(format!("{}", path), 0)
                })?;
            }
            _ => {
                return Err(crate::error::Error::WorkflowFieldNotFound(
                    format!("{}", path),
                    0,
                ));
            }
        }
    }

    // Convert final value to string
    let result = match current {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Null => "null".to_string(),
        _ => serde_json::to_string(current).unwrap_or_else(|_| "null".to_string()),
    };

    Ok(result)
}
