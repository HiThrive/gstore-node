"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arrify_1 = __importDefault(require("arrify"));
/**
 * Returns all the schema properties that are references
 * to other entities (their value is an entity Key)
 */
const getEntitiesRefsFromSchema = (schema) => Object.entries(schema.paths)
    .filter(([, pathConfig]) => pathConfig.type === 'entityKey')
    .map(([property]) => property);
/**
 *
 * @param {*} initialPath Path to add to the refs array
 * @param {*} select Array of properties to select from the populated ref
 * @param {*} refs Array of refs, each index is one level deep in the entityData tree
 *
 * @example
 *
 * const entityData = {
 *  user: Key, // ---> once fetched it will be { name: String, company: Key }
 *  address: Key
 * }
 *
 * To fetch the "address", the "user" and the user's "conmpany", the array of refs
 * to retrieve will have the following shape
 *
 * [
 *  [{ path: 'user', select: ['*'] }, [ path: 'address', select: ['*'] ], // tree depth at level 0
 *  [{ path: 'user.company', select: ['*'] }], // tree depth at level 1 (will be fetched after level 0 has been fetched)
 * ]
 */
const addPathToPopulateRefs = (initialPath, _select = ['*'], refs) => {
    const pathToArray = initialPath.split('.');
    const select = (0, arrify_1.default)(_select);
    let prefix = '';
    pathToArray.forEach((prop, i) => {
        const currentPath = prefix ? `${prefix}.${prop}` : prop;
        const nextPath = pathToArray[i + 1];
        const hasNextPath = typeof nextPath !== 'undefined';
        const refsAtCurrentTreeLevel = refs[i] || [];
        // Check if we alreday have a config for this tree level
        const pathConfig = refsAtCurrentTreeLevel.find((ref) => ref.path === currentPath);
        if (!pathConfig) {
            refsAtCurrentTreeLevel.push({ path: currentPath, select: hasNextPath ? [nextPath] : select });
        }
        else if (hasNextPath && !pathConfig.select.some((s) => s === nextPath)) {
            // Add the next path to the selected properties on the ref
            pathConfig.select.push(nextPath);
        }
        else if (!hasNextPath && select.length) {
            pathConfig.select.push(...select);
        }
        refs[i] = refsAtCurrentTreeLevel;
        prefix = currentPath;
    });
};
const populateFactory = (refsToPopulate, promise, schema) => {
    const populateHandler = (path, propsToSelect) => {
        if (propsToSelect && Array.isArray(path)) {
            throw new Error('Only 1 property can be populated when fields to select are provided');
        }
        // If no path is specified, we fetch all the schema properties that are references to entities (Keys)
        const paths = path ? (0, arrify_1.default)(path) : getEntitiesRefsFromSchema(schema);
        paths.forEach((p) => addPathToPopulateRefs(p, propsToSelect, refsToPopulate));
        return promise;
    };
    return populateHandler;
};
exports.default = { addPathToPopulateRefs, populateFactory };
