"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstoreEntity = void 0;
const is_1 = __importDefault(require("is"));
const promised_hooks_1 = __importDefault(require("promised-hooks"));
const defaultValues_1 = __importDefault(require("./helpers/defaultValues"));
const helpers_1 = __importDefault(require("./helpers"));
const serializers_1 = require("./serializers");
const errors_1 = require("./errors");
const { validation, populateHelpers } = helpers_1.default;
const { populateFactory } = populateHelpers;
class GstoreEntity {
    /* The entity Key */
    entityKey;
    /* The entity data */
    entityData = {};
    /**
     * If you provided a dataloader instance when saving the entity, it will
     * be added as property. You will then have access to it in your "pre" save() hooks.
     */
    dataloader;
    context;
    __gstore; // Added when creating the Model
    __schema; // Added when creating the Model
    __entityKind; // Added when creating the Model
    __hooksEnabled = true;
    constructor(data, id, ancestors, namespace, key) {
        /**
         * Object to store custom data for the entity.
         * In some cases we might want to add custom data onto the entity
         * and as Typescript won't allow random properties to be added, this
         * is the place to add data based on the context.
         */
        this.context = {};
        // Get the model class
        const model = this.constructor;
        // Set up required properties from the model
        if (!this.__gstore)
            this.__gstore = model.gstore;
        if (!this.__schema)
            this.__schema = model.schema;
        if (!this.__entityKind)
            this.__entityKind = model.entityKind;
        if (key) {
            if (!this.gstore.ds.isKey(key)) {
                throw new Error('Entity Key must be a Datastore Key');
            }
            this.entityKey = key;
        }
        else {
            this.entityKey = this.__createKey(id, ancestors, namespace);
        }
        // create entityData from data provided
        this.__buildEntityData(data || {});
        this.__addAliasAndVirtualProperties();
        this.__addCustomMethodsFromSchema();
        // Wrap entity with hook "pre" and "post" methods
        promised_hooks_1.default.wrap(this);
        // Add the middlewares defined on the Schena
        this.__registerHooksFromSchema();
    }
    /**
     * Save the entity in the Datastore
     *
     * @param {Transaction} transaction The optional transaction to save the entity into
     * @param options Additional configuration
     * @returns {Promise<GstoreEntity<T>>}
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/save
     */
    save(transaction, opts) {
        this.__hooksEnabled = true;
        const options = {
            method: 'upsert',
            sanitizeEntityData: true,
            ...opts,
        };
        // ------------------------ HANDLERS ---------------------------------
        // -------------------------------------------------------------------
        const validateEntityData = () => {
            if (this.schema.options.validateBeforeSave) {
                return this.validate();
            }
            return { error: null };
        };
        const validateMethod = (method) => {
            const allowed = {
                update: true,
                insert: true,
                upsert: true,
            };
            return !allowed[method]
                ? { error: new Error('Method must be either "update", "insert" or "upsert"') }
                : { error: null };
        };
        const validateDataAndMethod = () => {
            const { error: entityDataError } = validateEntityData();
            let methodError;
            if (!entityDataError) {
                ({ error: methodError } = validateMethod(options.method));
            }
            return { error: entityDataError || methodError };
        };
        const onEntitySaved = () => {
            /**
             * Make sure to clear the cache for this Entity Kind
             */
            if (this.constructor.__hasCache(options)) {
                return this.constructor
                    .clearCache()
                    .then(() => this)
                    .catch((err) => {
                    let msg = 'Error while clearing the cache after saving the entity.';
                    msg += 'The entity has been saved successfully though. ';
                    msg += 'Both the cache error and the entity saved have been attached.';
                    const cacheError = new Error(msg);
                    cacheError.__entity = this;
                    cacheError.__cacheError = err;
                    throw cacheError;
                });
            }
            return Promise.resolve(this);
        };
        /**
         * If it is a transaction, we create a hooks.post array that will be executed
         * when transaction succeeds by calling transaction.execPostHooks() (returns a Promises)
         */
        const attachPostHooksToTransaction = () => {
            // Disable the "post" hooks as we will only run them after the transaction succcees
            this.__hooksEnabled = false;
            this.constructor.__hooksTransaction.call(this, transaction, this.__posts ? this.__posts.save : undefined);
        };
        // ------------------------ END HANDLERS --------------------------------
        if (options.sanitizeEntityData) {
            // this.entityData = (this.constructor as Model<T>).sanitize.call(this.constructor, this.entityData, {
            this.entityData = this.constructor.sanitize.call(this.constructor, this.entityData, {
                disabled: ['write'],
            });
        }
        const { error } = validateDataAndMethod();
        if (error) {
            return Promise.reject(error);
        }
        this.serializeEntityData();
        const datastoreEntity = serializers_1.datastoreSerializer.toDatastore(this);
        datastoreEntity.method = options.method;
        if (transaction) {
            if (transaction.constructor.name !== 'Transaction') {
                return Promise.reject(new Error('Transaction needs to be a gcloud Transaction'));
            }
            attachPostHooksToTransaction();
            transaction.save(datastoreEntity);
            return Promise.resolve(this);
        }
        return this.gstore.ds.save(datastoreEntity).then(onEntitySaved);
    }
    /**
     * Validate the entity data. It returns an object with an `error` and a `value` property.
     * If the error is `null`, the validation has passed.
     * The `value` returned is the entityData sanitized (unknown properties removed).
     *
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/validate
     */
    validate() {
        const { entityData, schema, entityKind, gstore } = this;
        return validation.validate(entityData, schema, entityKind, gstore.ds);
    }
    /**
     * Returns a JSON object of the entity data along with the entity id/name.
     * The properties on the Schema where "read" has been set to "false" won't be added
     * unless `readAll: true` is passed in the options.
     *
     * @param options Additional configuration
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/plain
     */
    plain(options = {}) {
        if (!is_1.default.object(options)) {
            throw new Error('Options must be an Object');
        }
        const readAll = !!options.readAll || false;
        const virtuals = !!options.virtuals || false;
        const showKey = !!options.showKey || false;
        if (virtuals) {
            // Add any possible virtual properties to the object
            this.entityData = this.__getEntityDataWithVirtuals();
        }
        const data = serializers_1.datastoreSerializer.fromDatastore(this.entityData, this.constructor, {
            readAll,
            showKey,
        });
        return data;
    }
    get(path) {
        if ({}.hasOwnProperty.call(this.schema.__virtuals, path)) {
            return this.schema.__virtuals[path].applyGetters(this.entityData);
        }
        return this.entityData[path];
    }
    set(path, value) {
        if ({}.hasOwnProperty.call(this.schema.__virtuals, path)) {
            this.schema.__virtuals[path].applySetters(value, this.entityData);
            return this;
        }
        this.entityData[path] = value;
        return this;
    }
    /**
     * Access any gstore Model from the entity instance.
     *
     * @param {string} entityKind The entity kind
     * @returns {Model} The Model
     * @example
    ```
    const user = new User({ name: 'john', pictId: 123});
    const ImageModel = user.model('Image');
    ImageModel.get(user.pictId).then(...);
    ```
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/model
     */
    model(name) {
        return this.gstore.model(name);
    }
    // TODO: Rename this function "fetch" (and create alias to this for backward compatibility)
    /**
     * Fetch entity from Datastore
     *
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/datastoreentity
     */
    datastoreEntity(options = {}) {
        const onEntityFetched = (result) => {
            const entityData = result ? result[0] : null;
            if (!entityData) {
                if (this.gstore.config.errorOnEntityNotFound) {
                    const error = new Error('Entity not found');
                    error.code = errors_1.ERROR_CODES.ERR_ENTITY_NOT_FOUND;
                    throw error;
                }
                return null;
            }
            this.entityData = entityData;
            return this;
        };
        if (this.constructor.__hasCache(options)) {
            return this.gstore.cache.keys.read(this.entityKey, options).then(onEntityFetched);
        }
        return this.gstore.ds.get(this.entityKey).then(onEntityFetched);
    }
    /**
     * Populate entity references (whose properties are an entity Key) and merge them in the entity data.
     *
     * @param refs The entity references to fetch from the Datastore. Can be one (string) or multiple (array of string)
     * @param properties The properties to return from the reference entities. If not specified, all properties will be returned
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/populate
     */
    populate(path, propsToSelect) {
        const refsToPopulate = [];
        const promise = Promise.resolve(this).then(this.constructor.__populate(refsToPopulate));
        promise.populate = populateFactory(refsToPopulate, promise, this.schema);
        promise.populate(path, propsToSelect);
        return promise;
    }
    /**
     * Process some basic formatting to the entity data before save
     * - automatically set the modifiedOn property to current date (if the property exists on schema)
     * - convert object with latitude/longitude to Datastore GeoPoint
     * - convert string date to Date object
     */
    serializeEntityData() {
        /**
         * If the schema has a "modifiedOn" property we automatically
         * update its value to the current dateTime
         */
        if ({}.hasOwnProperty.call(this.schema.paths, 'modifiedOn')) {
            this.entityData.modifiedOn = new Date();
        }
        /**
         * If the entityData has 'geoPoint' property(ies)
         * and its value is an object with "latitude" and "longitude"
         * we convert it to a datastore GeoPoint.
         */
        if ({}.hasOwnProperty.call(this.schema.__meta, 'geoPointsProps')) {
            this.schema.__meta.geoPointsProps.forEach((property) => {
                const propValue = this.entityData[property];
                if ({}.hasOwnProperty.call(this.entityData, property) &&
                    propValue !== null &&
                    propValue.constructor.name !== 'GeoPoint') {
                    this.entityData[property] = this.gstore.ds.geoPoint(propValue);
                }
            });
        }
        if ({}.hasOwnProperty.call(this.schema.__meta, 'dateProps')) {
            this.schema.__meta.dateProps.forEach((property) => {
                const propValue = this.entityData[property];
                if ({}.hasOwnProperty.call(this.entityData, property) &&
                    propValue !== null &&
                    propValue instanceof Date === false) {
                    this.entityData[property] = new Date(propValue);
                }
            });
        }
    }
    get id() {
        return this.entityKey.id || this.entityKey.name;
    }
    /**
     * The gstore instance
     */
    get gstore() {
        if (this.__gstore === undefined) {
            throw new Error('No gstore instance attached to entity');
        }
        return this.__gstore;
    }
    /**
     * The entity Model Schema
     */
    get schema() {
        if (this.__schema === undefined) {
            throw new Error('No schema instance attached to entity');
        }
        return this.__schema;
    }
    /**
     * The Datastore entity kind
     */
    get entityKind() {
        if (this.__entityKind === undefined) {
            throw new Error('No entity kind attached to entity');
        }
        return this.__entityKind;
    }
    __buildEntityData(data) {
        const { schema } = this;
        const isJoiSchema = schema.isJoi;
        // If Joi schema, get its default values
        if (isJoiSchema) {
            const { error, value } = schema.validateJoi(data);
            if (!error) {
                this.entityData = { ...value };
            }
        }
        this.entityData = { ...this.entityData, ...data };
        Object.entries(schema.paths).forEach(([key, prop]) => {
            const hasValue = {}.hasOwnProperty.call(this.entityData, key);
            const isOptional = {}.hasOwnProperty.call(prop, 'optional') && prop.optional !== false;
            const isRequired = {}.hasOwnProperty.call(prop, 'required') && prop.required === true;
            // Set Default Values
            if (!isJoiSchema && !hasValue && !isOptional) {
                let value = null;
                if ({}.hasOwnProperty.call(prop, 'default')) {
                    if (typeof prop.default === 'function') {
                        value = prop.default();
                    }
                    else {
                        value = prop.default;
                    }
                }
                if ({}.hasOwnProperty.call(defaultValues_1.default.__map__, value)) {
                    /**
                     * If default value is in the gstore.defaultValue hashTable
                     * then execute the handler for that shortcut
                     */
                    value = defaultValues_1.default.__handler__(value);
                }
                else if (value === null && {}.hasOwnProperty.call(prop, 'values') && !isRequired) {
                    // Default to first value of the allowed values if **not** required
                    [value] = prop.values;
                }
                this.entityData[key] = value;
            }
        });
        // add Symbol Key to the entityData
        this.entityData[this.gstore.ds.KEY] = this.entityKey;
    }
    __createKey(id, ancestors, namespace) {
        if (id && !is_1.default.number(id) && !is_1.default.string(id)) {
            throw new Error('id must be a string or a number');
        }
        const hasAncestors = typeof ancestors !== 'undefined' && ancestors !== null && is_1.default.array(ancestors);
        let path = hasAncestors ? [...ancestors] : [];
        if (id) {
            path = [...path, this.entityKind, id];
        }
        else {
            path.push(this.entityKind);
        }
        return namespace ? this.gstore.ds.key({ namespace, path }) : this.gstore.ds.key(path);
    }
    __addAliasAndVirtualProperties() {
        const { schema } = this;
        // Create virtual properties (getters and setters for entityData object)
        Object.keys(schema.paths)
            .filter((pathKey) => ({}.hasOwnProperty.call(schema.paths, pathKey)))
            .forEach((pathKey) => Object.defineProperty(this, pathKey, {
            get: function getProp() {
                return this.entityData[pathKey];
            },
            set: function setProp(newValue) {
                this.entityData[pathKey] = newValue;
            },
        }));
        // Create virtual properties (getters and setters for "virtuals" defined on the Schema)
        Object.keys(schema.__virtuals)
            .filter((key) => ({}.hasOwnProperty.call(schema.__virtuals, key)))
            .forEach((key) => Object.defineProperty(this, key, {
            get: function getProp() {
                return schema.__virtuals[key].applyGetters({ ...this.entityData });
            },
            set: function setProp(newValue) {
                schema.__virtuals[key].applySetters(newValue, this.entityData);
            },
        }));
    }
    __registerHooksFromSchema() {
        const callQueue = this.schema.__callQueue.entity;
        if (!Object.keys(callQueue).length) {
            return this;
        }
        Object.keys(callQueue).forEach((method) => {
            if (!this[method]) {
                return;
            }
            // Add Pre hooks
            callQueue[method].pres.forEach((fn) => {
                this.pre(method, fn);
            });
            // Add Pre hooks
            callQueue[method].post.forEach((fn) => {
                this.post(method, fn);
            });
        });
        return this;
    }
    __addCustomMethodsFromSchema() {
        Object.entries(this.schema.methods).forEach(([method, handler]) => {
            this[method] = handler;
        });
    }
    __getEntityDataWithVirtuals() {
        const { __virtuals } = this.schema;
        const entityData = { ...this.entityData };
        Object.keys(__virtuals).forEach((k) => {
            if ({}.hasOwnProperty.call(entityData, k)) {
                __virtuals[k].applySetters(entityData[k], entityData);
            }
            else {
                __virtuals[k].applyGetters(entityData);
            }
        });
        return entityData;
    }
}
exports.GstoreEntity = GstoreEntity;
exports.default = GstoreEntity;
