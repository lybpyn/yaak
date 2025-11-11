use serde::{Serialize, Serializer};
use thiserror::Error;
use wasm_bindgen::JsValue;

#[derive(Error, Debug, PartialEq)]
pub enum Error {
    #[error("Render Error: {0}")]
    RenderError(String),

    #[error("Render Error: Variable \"{0}\" is not defined in active environment")]
    VariableNotFound(String),

    #[error("Render Error: Max recursion depth exceeded")]
    RenderStackExceededError,

    // Workflow template errors
    #[error("Workflow Error: Step {0} has not been executed yet")]
    WorkflowStepNotExecuted(usize),

    #[error("Workflow Error: Field '{0}' not found in step {1} response")]
    WorkflowFieldNotFound(String, usize),

    #[error("Workflow Error: Header '{0}' not found in step {1} response")]
    WorkflowHeaderNotFound(String, usize),

    #[error("Workflow Error: Invalid syntax - {0}")]
    WorkflowInvalidSyntax(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl Into<JsValue> for Error {
    fn into(self) -> JsValue {
        serde_wasm_bindgen::to_value(&self).unwrap()
    }
}

pub type Result<T> = std::result::Result<T, Error>;
