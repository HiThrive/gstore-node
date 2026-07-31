/**
 * Minimal path get/set helpers (replaces lodash.get / lodash.set).
 */
export declare const get: (object: unknown, path: string) => unknown;
export declare const set: (object: Record<string, unknown>, path: string, value: unknown) => Record<string, unknown>;
