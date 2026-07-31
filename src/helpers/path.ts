/**
 * Minimal path get/set helpers (replaces lodash.get / lodash.set).
 */

const PATH_SEPARATOR = '.';

const toPathParts = (path: string): string[] => path.split(PATH_SEPARATOR).filter((p) => p.length > 0);

export const get = (object: unknown, path: string): unknown => {
  if (object == null) {
    return undefined;
  }

  return toPathParts(path).reduce((acc: unknown, key) => {
    if (acc == null || (typeof acc !== 'object' && typeof acc !== 'function')) {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, object);
};

export const set = (object: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
  const parts = toPathParts(path);
  if (!parts.length) {
    return object;
  }

  let current: Record<string, unknown> = object;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = current[key];
    if (next == null || typeof next !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return object;
};
