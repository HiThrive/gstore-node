"use strict";
/**
 * Minimal path get/set helpers (replaces lodash.get / lodash.set).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.set = exports.get = void 0;
const PATH_SEPARATOR = '.';
const toPathParts = (path) => path.split(PATH_SEPARATOR).filter((p) => p.length > 0);
const get = (object, path) => {
    if (object == null) {
        return undefined;
    }
    return toPathParts(path).reduce((acc, key) => {
        if (acc == null || (typeof acc !== 'object' && typeof acc !== 'function')) {
            return undefined;
        }
        return acc[key];
    }, object);
};
exports.get = get;
const set = (object, path, value) => {
    const parts = toPathParts(path);
    if (!parts.length) {
        return object;
    }
    let current = object;
    for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i];
        const next = current[key];
        if (next == null || typeof next !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[parts[parts.length - 1]] = value;
    return object;
};
exports.set = set;
