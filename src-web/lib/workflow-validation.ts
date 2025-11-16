/**
 * Validation utilities for workflow node configuration
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that a required field has a non-empty value
 *
 * @param value - The field value to check
 * @param fieldName - Name of the field for error messages
 * @returns Validation error or null if valid
 */
export function validateRequired(value: unknown, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }
  return null;
}

/**
 * Validate that a value is a valid URL format
 *
 * @param value - The URL string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation error or null if valid
 */
export function validateUrl(value: string, fieldName: string): ValidationError | null {
  if (!value) return null; // Skip if empty (use validateRequired for that)

  // Allow template variables
  if (value.includes('{{') && value.includes('}}')) {
    return null;
  }

  try {
    new URL(value);
    return null;
  } catch {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
    };
  }
}

/**
 * Validate that a number is within a specified range
 *
 * @param value - The number to validate
 * @param fieldName - Name of the field for error messages
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns Validation error or null if valid
 */
export function validateRange(
  value: number | '',
  fieldName: string,
  min?: number,
  max?: number,
): ValidationError | null {
  if (value === '') return null;

  if (min !== undefined && value < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min}`,
    };
  }

  if (max !== undefined && value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${max}`,
    };
  }

  return null;
}

/**
 * Validate template syntax (basic check for balanced {{ }})
 *
 * @param value - The template string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation error or null if valid
 */
export function validateTemplateSyntax(value: string, fieldName: string): ValidationError | null {
  if (!value) return null;

  const openCount = (value.match(/\{\{/g) || []).length;
  const closeCount = (value.match(/\}\}/g) || []).length;

  if (openCount !== closeCount) {
    return {
      field: fieldName,
      message: `${fieldName} has unbalanced template syntax ({{ and }})`,
    };
  }

  return null;
}

/**
 * Validate email format
 *
 * @param value - The email string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation error or null if valid
 */
export function validateEmail(value: string, fieldName: string): ValidationError | null {
  if (!value) return null;

  // Allow template variables
  if (value.includes('{{') && value.includes('}}')) {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
    };
  }

  return null;
}

/**
 * Validate JSON syntax
 *
 * @param value - The JSON string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation error or null if valid
 */
export function validateJson(value: string, fieldName: string): ValidationError | null {
  if (!value) return null;

  // Allow template variables (skip JSON validation if templates present)
  if (value.includes('{{') && value.includes('}}')) {
    // Just check template syntax
    return validateTemplateSyntax(value, fieldName);
  }

  try {
    JSON.parse(value);
    return null;
  } catch {
    return {
      field: fieldName,
      message: `${fieldName} must be valid JSON`,
    };
  }
}

/**
 * Validate node configuration based on node subtype
 *
 * @param nodeSubtype - The type of node being validated
 * @param name - Node name
 * @param config - Node configuration object
 * @returns Validation result with all errors
 */
export function validateNodeConfig(
  nodeSubtype: string,
  name: string,
  config: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Common validation: name is required
  const nameError = validateRequired(name, 'Node Name');
  if (nameError) errors.push(nameError);

  // Type-specific validation
  switch (nodeSubtype) {
    case 'http_request': {
      const urlError = validateUrl(config.url as string, 'URL');
      if (urlError) errors.push(urlError);

      if (config.body) {
        const bodyError = validateJson(config.body as string, 'Body');
        if (bodyError) errors.push(bodyError);
      }
      break;
    }

    case 'email': {
      const toError = validateRequired(config.to, 'To');
      if (toError) errors.push(toError);
      else {
        const emailError = validateEmail(config.to as string, 'To');
        if (emailError) errors.push(emailError);
      }

      const subjectError = validateRequired(config.subject, 'Subject');
      if (subjectError) errors.push(subjectError);
      break;
    }

    case 'database': {
      const connError = validateRequired(config.connection_string, 'Connection String');
      if (connError) errors.push(connError);
      break;
    }

    case 'websocket': {
      const wsUrlError = validateUrl(config.url as string, 'WebSocket URL');
      if (wsUrlError) errors.push(wsUrlError);

      if (config.messages) {
        const msgsError = validateJson(config.messages as string, 'Messages');
        if (msgsError) errors.push(msgsError);
      }
      break;
    }

    case 'loop': {
      if (config.loop_type === 'count' || !config.loop_type) {
        const countError = validateRange(config.count as number | '', 'Count', 1, 1000);
        if (countError) errors.push(countError);
      }
      break;
    }

    case 'parallel': {
      const branchError = validateRange(config.branch_count as number | '', 'Branch Count', 2, 10);
      if (branchError) errors.push(branchError);
      break;
    }

    case 'conditional': {
      if (config.condition) {
        const condError = validateTemplateSyntax(config.condition as string, 'Condition');
        if (condError) errors.push(condError);
      }
      break;
    }

    case 'timer_trigger': {
      if (config.schedule_type === 'interval' || !config.schedule_type) {
        const intervalError = validateRange(config.interval_minutes as number | '', 'Interval', 1);
        if (intervalError) errors.push(intervalError);
      }
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
