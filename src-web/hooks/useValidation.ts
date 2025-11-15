import { useCallback, useState } from 'react';
import { invokeCmd } from '../lib/tauri';

interface ValidationError {
  nodeId?: string;
  field?: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate workflow graph structure and node configurations
 */
export function useValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validate workflow graph
  const validateWorkflow = useCallback(async (workflowId: string): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      const result = await invokeCmd<ValidationResult>('cmd_validate_workflow_graph', {
        workflowId,
      });

      setValidationResult(result);
      return result;
    } catch (err) {
      const errorResult: ValidationResult = {
        valid: false,
        errors: [{ message: `Validation failed: ${err}` }],
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Clear validation results
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  // Get errors for specific node
  const getNodeErrors = useCallback(
    (nodeId: string): ValidationError[] => {
      if (!validationResult) return [];
      return validationResult.errors.filter((e) => e.nodeId === nodeId);
    },
    [validationResult]
  );

  return {
    validateWorkflow,
    clearValidation,
    getNodeErrors,
    validationResult,
    isValidating,
    isValid: validationResult?.valid ?? true,
    hasErrors: validationResult ? !validationResult.valid : false,
  };
}
