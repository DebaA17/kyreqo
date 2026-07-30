import { EnvironmentVariable } from '../store/environmentStore';

/**
 * Substitutes {{variable}} placeholders in a string with values from environment variables
 * @param text - The string containing {{variable}} placeholders
 * @param variables - Array of environment variables with key, value, and enabled status
 * @returns The string with all placeholders replaced
 */
export const substituteVariables = (text: string, variables: EnvironmentVariable[]): string => {
  if (!text || !variables || variables.length === 0) {
    return text;
  }

  // Filter only enabled variables
  const enabledVariables = variables.filter(v => v.enabled);

  let result = text;

  // Replace each {{key}} with its value
  enabledVariables.forEach(variable => {
    const pattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
    result = result.replace(pattern, variable.value);
  });

  return result;
};

/**
 * Recursively substitutes variables in an object (for headers, body, params)
 * @param obj - The object containing strings with {{variable}} placeholders
 * @param variables - Array of environment variables
 * @returns The object with all string values substituted
 */
export const substituteVariablesInObject = <T>(obj: T, variables: EnvironmentVariable[]): T => {
  if (!obj || !variables || variables.length === 0) {
    return obj;
  }

  if (typeof obj === 'string') {
    return substituteVariables(obj, variables) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => substituteVariablesInObject(item, variables)) as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteVariablesInObject(value, variables);
    }
    return result as T;
  }

  return obj;
};

/**
 * Gets the active environment variables from the store
 * Helper function to be used with the environment store
 */
export const getActiveVariables = (
  environments: Array<{ id: string; variables: EnvironmentVariable[] }>,
  activeId: string | null
): EnvironmentVariable[] => {
  if (!activeId) return [];
  const activeEnv = environments.find(e => e.id === activeId);
  return activeEnv?.variables || [];
};
