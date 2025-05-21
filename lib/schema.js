"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_1 = __importDefault(require("optional"));
const extend_1 = __importDefault(require("extend"));
const is_1 = __importDefault(require("is"));
const arrify_1 = __importDefault(require("arrify"));
const constants_1 = require("./constants");
const virtualType_1 = __importDefault(require("./virtualType"));
const errors_1 = require("./errors");
const helpers_1 = __importDefault(require("./helpers"));
const Joi = (0, optional_1.default)('@hapi/joi') || (0, optional_1.default)('joi');
const IS_QUERY_METHOD = {
    update: true,
    delete: true,
    findOne: true,
};
const DEFAULT_OPTIONS = {
    validateBeforeSave: true,
    explicitOnly: true,
    excludeLargeProperties: false,
    queries: {
        readAll: false,
        format: constants_1.QUERIES_FORMATS.JSON,
    },
};
const RESERVED_PROPERTY_NAMES = {
    _events: true,
    _eventsCount: true,
    _lazySetupHooks: true,
    _maxListeners: true,
    _posts: true,
    _pres: true,
    className: true,
    constructor: true,
    delete: true,
    domain: true,
    ds: true,
    emit: true,
    entityData: true,
    entityKey: true,
    errors: true,
    excludeFromIndexes: true,
    get: true,
    getEntityDataWithVirtuals: true,
    gstore: true,
    hook: true,
    init: true,
    isModified: true,
    isNew: true,
    listeners: true,
    model: true,
    modelName: true,
    on: true,
    once: true,
    plain: true,
    post: true,
    pre: true,
    removeListener: true,
    removePost: true,
    removePre: true,
    save: true,
    schema: true,
    set: true,
    toObject: true,
    update: true,
    validate: true,
};
const { schemaHelpers: { extractMetaFromSchema }, } = helpers_1.default;
/**
 * gstore Schema
 */
class Schema {
    methods;
    paths;
    options = {};
    __virtuals;
    shortcutQueries;
    joiSchema;
    __callQueue;
    __meta;
    excludedFromIndexes;
    constructor(properties, options) {
        this.methods = {};
        this.paths = {};
        this.shortcutQueries = {};
        this.excludedFromIndexes = {};
        this.__virtuals = {};
        this.__callQueue = {
            model: {},
            entity: {},
        };
        this.options = Schema.initSchemaOptions(options);
        this.parseSchemaProperties(properties, this.options.joi);
        this.__meta = extractMetaFromSchema(this.paths);
    }
    /**
     * Add custom methods to entities.
     * @link https://sebloix.gitbook.io/gstore-node/schema/custom-methods
     *
     * @example
     * ```
     * schema.methods.profilePict = function() {
         return this.model('Image').get(this.imgIdx)
     * }
     * ```
    */
    method(name, fn) {
        if (typeof name !== 'string') {
            if (typeof name !== 'object') {
                return;
            }
            Object.keys(name).forEach((k) => {
                if (typeof name[k] === 'function') {
                    this.methods[k] = name[k];
                }
            });
        }
        else if (typeof fn === 'function') {
            this.methods[name] = fn;
        }
    }
    queries(type, settings) {
        this.shortcutQueries[type] = settings;
    }
    /**
     * Getter / Setter for Schema paths.
     *
     * @param {string} propName The entity property
     * @param {SchemaPathDefinition} [definition] The property definition
     * @link https://sebloix.gitbook.io/gstore-node/schema/methods/path
     */
    path(propName, definition) {
        if (typeof definition === 'undefined') {
            if (this.paths[propName]) {
                return this.paths[propName];
            }
            return undefined;
        }
        if (RESERVED_PROPERTY_NAMES[propName]) {
            throw new Error(`${propName} is reserved and can not be used as a schema pathname`);
        }
        this.paths[propName] = definition;
        return this;
    }
    /**
     * Register a middleware to be executed before "save()", "delete()", "findOne()" or any of your custom method.
     * The callback will receive the original argument(s) passed to the target method. You can modify them
     * in your resolve passing an object with an __override property containing the new parameter(s)
     * for the target method.
     *
     * @param {string} method The target method to add the hook to
     * @param {(...args: any[]) => Promise<any>} fn Function to execute before the target method.
     * It must return a Promise
     * @link https://sebloix.gitbook.io/gstore-node/middleware-hooks/pre-hooks
     */
    pre(method, fn) {
        const queue = IS_QUERY_METHOD[method] ? this.__callQueue.model : this.__callQueue.entity;
        if (!{}.hasOwnProperty.call(queue, method)) {
            queue[method] = {
                pres: [],
                post: [],
            };
        }
        return queue[method].pres.push(fn);
    }
    /**
     * Register a "post" middelware to execute after a target method.
     *
     * @param {string} method The target method to add the hook to
     * @param {(response: any) => Promise<any>} callback Function to execute after the target method.
     * It must return a Promise
     * @link https://sebloix.gitbook.io/gstore-node/middleware-hooks/post-hooks
     */
    post(method, fn) {
        const queue = IS_QUERY_METHOD[method] ? this.__callQueue.model : this.__callQueue.entity;
        if (!{}.hasOwnProperty.call(queue, method)) {
            queue[method] = {
                pres: [],
                post: [],
            };
        }
        return queue[method].post.push(fn);
    }
    /**
     * Getter / Setter of a virtual property.
     * Virtual properties are created dynamically and not saved in the Datastore.
     *
     * @param {string} propName The virtual property name
     * @link https://sebloix.gitbook.io/gstore-node/schema/methods/virtual
     */
    virtual(propName) {
        if (RESERVED_PROPERTY_NAMES[propName]) {
            throw new Error(`${propName} is reserved and can not be used as virtual property.`);
        }
        if (!{}.hasOwnProperty.call(this.__virtuals, propName)) {
            this.__virtuals[propName] = new virtualType_1.default(propName);
        }
        return this.__virtuals[propName];
    }
    /**
     * Executes joi.validate on given data. If the schema does not have a joi config object data is returned.
     *
     * @param {*} data The data to sanitize
     * @returns {*} The data sanitized
     */
    validateJoi(entityData) {
        if (!this.isJoi) {
            return {
                error: new errors_1.ValidationError(errors_1.ERROR_CODES.ERR_GENERIC, 'Schema does not have a joi configuration object'),
                value: entityData,
            };
        }
        return this.joiSchema.validate(entityData, this.options.joi.options || {});
    }
    updateExcludedFromIndexesMap(property, definition) {
        const isArray = definition.type === Array || (definition.joi && definition.joi._type === 'array');
        const isObject = definition.type === Object || (definition.joi && definition.joi._type === 'object');
        if (definition.excludeFromIndexes === true) {
            if (isArray) {
                // We exclude both the array values + all the child properties of object items
                this.excludedFromIndexes[property] = [`${String(property)}[]`, `${String(property)}[].*`];
            }
            else if (isObject) {
                // We exclude the emmbeded entity + all its properties
                this.excludedFromIndexes[property] = [property, `${String(property)}.*`];
            }
            else {
                this.excludedFromIndexes[property] = [property];
            }
        }
        else if (definition.excludeFromIndexes !== false) {
            const excludedArray = (0, arrify_1.default)(definition.excludeFromIndexes);
            if (isArray) {
                // The format to exclude a property from an embedded entity inside
                // an array is: "myArrayProp[].embeddedKey"
                this.excludedFromIndexes[property] = excludedArray.map((propExcluded) => `${String(property)}[].${propExcluded}`);
            }
            else if (isObject) {
                // The format to exclude a property from an embedded entity
                // is: "myEmbeddedEntity.key"
                this.excludedFromIndexes[property] = excludedArray.map((propExcluded) => `${String(property)}.${propExcluded}`);
            }
        }
    }
    /**
     * Flag that returns "true" if the schema has a joi config object.
     */
    get isJoi() {
        return !is_1.default.undefined(this.joiSchema);
    }
    parseSchemaProperties(properties, joiConfig) {
        const isJoiSchema = joiConfig !== undefined;
        const joiKeys = {};
        let hasJoiExtras = false;
        if (isJoiSchema) {
            hasJoiExtras = is_1.default.object(joiConfig.extra);
        }
        // Parse the Schema properties and add to our maps and build meta data.
        Object.entries(properties).forEach(([property, definition]) => {
            if (RESERVED_PROPERTY_NAMES[property]) {
                throw new Error(`${property} is reserved and can not be used as a schema property.`);
            }
            // Add property to our paths map
            this.paths[property] = definition;
            // If property has a Joi rule, add it to our joiKeys map
            if (isJoiSchema && {}.hasOwnProperty.call(definition, 'joi')) {
                joiKeys[property] = definition.joi;
            }
            this.updateExcludedFromIndexesMap(property, definition);
        });
        if (isJoiSchema) {
            let joiSchema = Joi.object().keys(joiKeys);
            if (hasJoiExtras) {
                Object.keys(joiConfig.extra).forEach((k) => {
                    if (is_1.default.function(joiSchema[k])) {
                        const args = joiConfig.extra[k];
                        joiSchema = joiSchema[k](...args);
                    }
                });
            }
            this.joiSchema = joiSchema;
        }
    }
    static initSchemaOptions(provided) {
        const options = (0, extend_1.default)(true, {}, DEFAULT_OPTIONS, provided);
        if (options.joi) {
            const joiOptionsDefault = {
                options: {
                    allowUnknown: options.explicitOnly !== true,
                },
            };
            if (is_1.default.object(options.joi)) {
                options.joi = (0, extend_1.default)(true, {}, joiOptionsDefault, options.joi);
            }
            else {
                options.joi = { ...joiOptionsDefault };
            }
            if (!Object.prototype.hasOwnProperty.call(options.joi.options, 'stripUnknown')) {
                options.joi.options.stripUnknown = options.joi.options.allowUnknown !== true;
            }
        }
        return options;
    }
    /**
     * Custom Schema Types
     */
    static Types = {
        /**
         * Datastore Double object. For long doubles, a string can be provided.
         * @link https://googleapis.dev/nodejs/datastore/latest/Double.html
         */
        Double: 'double',
        /**
         * Datastore Geo Point object.
         * @link https://googleapis.dev/nodejs/datastore/latest/GeoPoint.html
         */
        GeoPoint: 'geoPoint',
        /**
         * Used to reference another entity. See the `populate()` doc.
         * @link https://sebloix.gitbook.io/gstore-node/populate
         */
        Key: 'entityKey',
    };
}
exports.default = Schema;
