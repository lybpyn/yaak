#[cfg(test)]
mod tests {
    use crate::error::Result;
    use crate::renderer::*;
    use serde_json::json;
    use std::collections::HashMap;

    struct EmptyCB {}
    impl TemplateCallback for EmptyCB {
        async fn run(
            &self,
            _fn_name: &str,
            _args: HashMap<String, serde_json::Value>,
        ) -> Result<String> {
            Ok(String::new())
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
    async fn test_loop_index() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_loop_context(LoopContext {
            index: 5,
            total: 10,
            item: None,
        });

        let template = "${[ loop.index ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "5");
        Ok(())
    }

    #[tokio::test]
    async fn test_loop_total() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_loop_context(LoopContext {
            index: 5,
            total: 10,
            item: None,
        });

        let template = "Iteration ${[ loop.index ]} of ${[ loop.total ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "Iteration 5 of 10");
        Ok(())
    }

    #[tokio::test]
    async fn test_loop_item() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_loop_context(LoopContext {
            index: 0,
            total: 3,
            item: Some(json!({"name": "Alice", "age": 30})),
        });

        let template = "${[ loop.item.name ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "Alice");
        Ok(())
    }

    #[tokio::test]
    async fn test_loop_item_nested() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_loop_context(LoopContext {
            index: 0,
            total: 1,
            item: Some(json!({"user": {"profile": {"email": "alice@example.com"}}})),
        });

        let template = "${[ loop.item.user.profile.email ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "alice@example.com");
        Ok(())
    }

    #[tokio::test]
    async fn test_conditional_branch() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_conditional_branch("success".to_string());

        let template = "Branch: ${[ conditional.branch ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "Branch: success");
        Ok(())
    }

    #[tokio::test]
    async fn test_workflow_step_with_loop() -> Result<()> {
        let mut ctx = WorkflowContext::new();

        // Add a step response
        ctx.add_step_response(StepResponse {
            response_body: json!({"token": "abc123"}),
            response_headers: HashMap::new(),
            response_status: 200,
            response_elapsed: 100,
            response_url: "https://api.example.com".to_string(),
        });

        // Add loop context
        ctx.set_loop_context(LoopContext {
            index: 2,
            total: 5,
            item: Some(json!({"id": "user-456"})),
        });

        let template = "Token: ${[ workflow.step[0].response.body.token ]}, User: ${[ loop.item.id ]}, Iteration: ${[ loop.index ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "Token: abc123, User: user-456, Iteration: 2");
        Ok(())
    }

    #[tokio::test]
    async fn test_loop_without_context_error() -> Result<()> {
        let ctx = WorkflowContext::new(); // No loop context set

        let template = "${[ loop.index ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await;
        assert!(result.is_err());
        Ok(())
    }

    #[tokio::test]
    async fn test_conditional_without_context_error() -> Result<()> {
        let ctx = WorkflowContext::new(); // No conditional branch set

        let template = "${[ conditional.branch ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await;
        assert!(result.is_err());
        Ok(())
    }

    #[tokio::test]
    async fn test_loop_item_array_index() -> Result<()> {
        let mut ctx = WorkflowContext::new();
        ctx.set_loop_context(LoopContext {
            index: 0,
            total: 1,
            item: Some(json!(["first", "second", "third"])),
        });

        let template = "${[ loop.item.0 ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert_eq!(result, "first");
        Ok(())
    }

    #[tokio::test]
    async fn test_combined_workflow_loop_conditional() -> Result<()> {
        let mut ctx = WorkflowContext::new();

        // Add step responses
        ctx.add_step_response(StepResponse {
            response_body: json!({"users": [{"name": "Alice"}, {"name": "Bob"}]}),
            response_headers: HashMap::new(),
            response_status: 200,
            response_elapsed: 50,
            response_url: "https://api.example.com/users".to_string(),
        });

        // Set loop context
        ctx.set_loop_context(LoopContext {
            index: 1,
            total: 2,
            item: Some(json!({"name": "Bob"})),
        });

        // Set conditional branch
        ctx.set_conditional_branch("processing".to_string());

        let template = "Step 0 returned ${[ workflow.step[0].response.body.users ]} (status: ${[ workflow.step[0].response.status ]}), processing user ${[ loop.item.name ]} (${[ loop.index ]}/${[ loop.total ]}) in branch: ${[ conditional.branch ]}";
        let vars = HashMap::new();
        let opt = RenderOptions {
            error_behavior: RenderErrorBehavior::Throw,
        };

        let result = parse_and_render_with_workflow(template, &vars, Some(&ctx), &EmptyCB {}, &opt).await?;
        assert!(result.contains("Bob"));
        assert!(result.contains("status: 200"));
        assert!(result.contains("1/2"));
        assert!(result.contains("processing"));
        Ok(())
    }
}
