import { EnvironmentVariable } from '../store/environmentStore';

export const substituteVariables = (text: string, variables: EnvironmentVariable[]): string => {
  if (!text || !variables || variables.length === 0) {
    return text;
  }

  const enabledVariables = variables.filter(v => v.enabled);

  let result = text;

  enabledVariables.forEach(variable => {
    const pattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
    result = result.replace(pattern, variable.value);
  });

  return result;
};

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

export const getActiveVariables = (
  environments: Array<{ id: number; variables: EnvironmentVariable[] }>,
  activeId: number | null
): EnvironmentVariable[] => {
  if (!activeId) return [];
  const activeEnv = environments.find(e => e.id === activeId);
  return activeEnv?.variables || [];
};
