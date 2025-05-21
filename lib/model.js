"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModel = void 0;
const is_1 = __importDefault(require("is"));
const arrify_1 = __importDefault(require("arrify"));
const extend_1 = __importDefault(require("extend"));
const promised_hooks_1 = __importDefault(require("promised-hooks"));
const nsql_cache_datastore_1 = __importDefault(require("nsql-cache-datastore"));
const lodash_1 = require("lodash");
const entity_1 = __importDefault(require("./entity"));
const query_1 = __importDefault(require("./query"));
const errors_1 = require("./errors");
const helpers_1 = __importDefault(require("./helpers"));
const dsAdapter = (0, nsql_cache_datastore_1.default)();
const { populateHelpers } = helpers_1.default;
const { keyToString } = dsAdapter;
const { populateFactory } = populateHelpers;
/**
 * Pass all the "pre" and "post" hooks from schema to
 * the current ModelInstance
 */
const registerHooksFromSchema = (model, schema) => {
    const callQueue = schema.__callQueue.model;
    if (!Object.keys(callQueue).length) {
        return;
    }
    Object.keys(callQueue).forEach((method) => {
        // Add Pre hooks
        callQueue[method].pres.forEach((fn) => {
            model.pre(method, fn);
        });
        // Add Post hooks
        callQueue[method].post.forEach((fn) => {
            model.post(method, fn);
        });
    });
};
/**
 * Dynamically generate a new Gstore Model
 *
 * @param kind The Entity Kind
 * @param schema The Gstore Schema
 * @param gstore The Gstore instance
 */
const generateModel = (kind, schema, gstore) => {
    const model = class GstoreModel extends entity_1.default {
        static gstore = gstore;
        static schema = schema;
        static entityKind = kind;
        static __hooksEnabled = true;
        constructor(data, id, ancestors, namespace, key) {
            super(data, id, ancestors, namespace, key);
            Object.defineProperties(this, {
                __gstore: { value: gstore, writable: false },
                __schema: { value: schema, writable: false },
                __entityKind: { value: kind, writable: false }
            });
        }
        static key(ids, ancestors, namespace) {
            const keys = [];
            let isMultiple = false;
            const getPath = (id) => {
                let path = [this.entityKind];
                if (typeof id !== 'undefined' && id !== null) {
                    path.push(id);
                }
                if (ancestors && is_1.default.array(ancestors)) {
                    path = ancestors.concat(path);
                }
                return path;
            };
            const getKey = (id) => {
                const path = getPath(id);
                let key;
                if (typeof namespace !== 'undefined' && namespace !== null) {
                    key = this.gstore.ds.key({
                        namespace,
                        path,
                    });
                }
                else {
                    key = this.gstore.ds.key(path);
                }
                return key;
            };
            if (typeof ids !== 'undefined' && ids !== null) {
                const idsArray = (0, arrify_1.default)(ids);
                isMultiple = idsArray.length > 1;
                idsArray.forEach((id) => {
                    const key = getKey(id);
                    keys.push(key);
                });
            }
            else {
                const key = getKey(null);
                keys.push(key);
            }
            return isMultiple ? keys : keys[0];
        }
        static get(id, ancestors, namespace, transaction, options = {}) {
            const ids = (0, arrify_1.default)(id);
            const key = this.key(ids, ancestors, namespace);
            const refsToPopulate = [];
            const { dataloader } = options;
            const onEntity = (entityDataFetched) => {
                const entityData = (0, arrify_1.default)(entityDataFetched);
                if (ids.length === 1 &&
                    (entityData.length === 0 || typeof entityData[0] === 'undefined' || entityData[0] === null)) {
                    if (this.gstore.config.errorOnEntityNotFound) {
                        throw new errors_1.GstoreError(errors_1.ERROR_CODES.ERR_ENTITY_NOT_FOUND, `${this.entityKind} { ${ids[0].toString()} } not found`);
                    }
                    return null;
                }
                // Convert entityData to Entity instance
                const entity = entityData.map((data) => {
                    if (typeof data === 'undefined' || data === null) {
                        return null;
                    }
                    return new this(data, undefined, undefined, undefined, data[this.gstore.ds.KEY]);
                });
                // TODO: Check if this is still useful??
                if (Array.isArray(id) && options.preserveOrder && entity.every((e) => typeof e !== 'undefined' && e !== null)) {
                    entity.sort((a, b) => {
                        const aId = a.entityKey.id;
                        const bId = b.entityKey.id;
                        if (aId === undefined || bId === undefined)
                            return 0;
                        return id.indexOf(aId) - id.indexOf(bId);
                    });
                }
                return Array.isArray(id) ? entity : entity[0];
            };
            const promise = this.__fetchEntityByKey(key, transaction, dataloader, options)
                .then(onEntity)
                .then(this.__populate(refsToPopulate, { ...options, transaction }));
            promise.populate = populateFactory(refsToPopulate, promise, this.schema);
            return promise;
        }
        static update(id, data, ancestors, namespace, transaction, options) {
            this.__hooksEnabled = true;
            let entityDataUpdated;
            let internalTransaction = false;
            const key = this.key(id, ancestors, namespace);
            const replace = options && options.replace === true;
            const getEntity = () => {
                return transaction.get(key).then(([entityData]) => {
                    if (typeof entityData === 'undefined') {
                        throw new errors_1.GstoreError(errors_1.ERROR_CODES.ERR_ENTITY_NOT_FOUND, `Entity { ${id.toString()} } to update not found`);
                    }
                    (0, extend_1.default)(false, entityData, data);
                    const result = {
                        key: entityData[this.gstore.ds.KEY],
                        data: entityData,
                    };
                    return result;
                });
            };
            const saveEntity = (datastoreFormat) => {
                const { key: entityKey, data: entityData } = datastoreFormat;
                const entity = new this(entityData, undefined, undefined, undefined, entityKey);
                /**
                 * If a DataLoader instance is passed in the options
                 * attach it to the entity so it is available in "pre" hooks
                 */
                if (options && options.dataloader) {
                    entity.dataloader = options.dataloader;
                }
                return entity.save(transaction).then((result) => result);
            };
            const onTransactionSuccess = () => {
                /**
                 * Make sure to delete the cache for this key
                 */
                if (this.__hasCache(options)) {
                    return this.clearCache(key)
                        .then(() => entityDataUpdated)
                        .catch((err) => {
                        let msg = 'Error while clearing the cache after updating the entity.';
                        msg += 'The entity has been updated successfully though. ';
                        msg += 'Both the cache error and the entity updated have been attached.';
                        const cacheError = new Error(msg);
                        cacheError.__entityUpdated = entityDataUpdated;
                        cacheError.__cacheError = err;
                        throw cacheError;
                    });
                }
                return Promise.resolve(entityDataUpdated);
            };
            const onEntityUpdated = (entity) => {
                entityDataUpdated = entity;
                if (options && options.dataloader) {
                    options.dataloader.clear(key);
                }
                if (internalTransaction) {
                    // If we created the Transaction instance internally for the update, we commit it
                    // otherwise we leave the commit() call to the transaction creator
                    return transaction
                        .commit()
                        .then(() => transaction.execPostHooks().catch((err) => {
                        entityDataUpdated[entityDataUpdated.gstore.ERR_HOOKS] = (entityDataUpdated[entityDataUpdated.gstore.ERR_HOOKS] || []).push(err);
                    }))
                        .then(onTransactionSuccess);
                }
                return onTransactionSuccess();
            };
            const getAndUpdate = () => getEntity().then(saveEntity).then(onEntityUpdated);
            const onUpdateError = (err) => {
                const error = Array.isArray(err) ? err[0] : err;
                if (internalTransaction) {
                    // If we created the Transaction instance internally for the update, we rollback it
                    // otherwise we leave the rollback() call to the transaction creator
                    // TODO: Check why transaction!.rollback does not return a Promise by default
                    return transaction.rollback().then(() => {
                        throw error;
                    });
                }
                throw error;
            };
            /**
             * If options.replace is set to true we don't fetch the entity
             * and save the data directly to the specified key, overriding any previous data.
             */
            if (replace) {
                return saveEntity({ key, data }).then(onEntityUpdated).catch(onUpdateError);
            }
            if (typeof transaction === 'undefined' || transaction === null) {
                internalTransaction = true;
                transaction = this.gstore.ds.transaction();
                return transaction.run().then(getAndUpdate).catch(onUpdateError);
            }
            if (transaction.constructor.name !== 'Transaction') {
                return Promise.reject(new Error('Transaction needs to be a gcloud Transaction'));
            }
            return getAndUpdate();
        }
        static delete(id, ancestors, namespace, transaction, key, options = {}) {
            this.__hooksEnabled = true;
            if (!key) {
                key = this.key(id, ancestors, namespace);
            }
            if (transaction && transaction.constructor.name !== 'Transaction') {
                return Promise.reject(new Error('Transaction needs to be a gcloud Transaction'));
            }
            /**
             * If it is a transaction, we create a hooks.post array that will be executed
             * when transaction succeeds by calling transaction.execPostHooks() ---> returns a Promise
             */
            if (transaction) {
                // disable (post) hooks, to only trigger them if transaction succeeds
                this.__hooksEnabled = false;
                this.__hooksTransaction(transaction, this.__posts ? this.__posts.delete : undefined);
                transaction.delete(key);
                return Promise.resolve({ key });
            }
            return this.gstore.ds.delete(key).then((results) => {
                const response = results ? results[0] : {};
                response.key = key;
                /**
                 * If we passed a DataLoader instance, we clear its cache
                 */
                if (options.dataloader) {
                    options.dataloader.clear(key);
                }
                if (response.indexUpdates !== undefined) {
                    response.success = response.indexUpdates > 0;
                }
                /**
                 * Make sure to delete the cache for this key
                 */
                if (this.__hasCache(options)) {
                    return this.clearCache(key, options.clearQueries)
                        .then(() => response)
                        .catch((err) => {
                        let msg = 'Error while clearing the cache after deleting the entity.';
                        msg += 'The entity has been deleted successfully though. ';
                        msg += 'The cache error has been attached.';
                        const cacheError = new Error(msg);
                        cacheError.__response = response;
                        cacheError.__cacheError = err;
                        throw cacheError;
                    });
                }
                return response;
            });
        }
        static deleteAll(ancestors, namespace) {
            const maxEntitiesPerBatch = 500;
            const timeoutBetweenBatches = 500;
            /**
             * We limit the number of entities fetched to 100.000 to avoid hang up the system when
             * there are > 1 million of entities to delete
             */
            const QUERY_LIMIT = 100000;
            let currentBatch;
            let totalBatches;
            let entities;
            const runQueryAndDeleteEntities = () => {
                const deleteEntities = (batch) => {
                    const onEntitiesDeleted = () => {
                        currentBatch += 1;
                        if (currentBatch < totalBatches) {
                            // Still more batches to process
                            return new Promise((resolve) => {
                                setTimeout(resolve, timeoutBetweenBatches);
                            }).then(() => deleteEntities(currentBatch));
                        }
                        // Re-run the fetch Query in case there are still entities to delete
                        return runQueryAndDeleteEntities();
                    };
                    const indexStart = batch * maxEntitiesPerBatch;
                    const indexEnd = indexStart + maxEntitiesPerBatch;
                    const entitiesToDelete = entities.slice(indexStart, indexEnd);
                    if (this.__pres && {}.hasOwnProperty.call(this.__pres, 'delete')) {
                        // We execute delete in serie (chaining Promises) --> so we call each possible pre & post hooks
                        return entitiesToDelete
                            .reduce((promise, entity) => promise.then(() => this.delete(undefined, undefined, undefined, undefined, entity[this.gstore.ds.KEY])), Promise.resolve())
                            .then(onEntitiesDeleted);
                    }
                    const keys = entitiesToDelete.map((entity) => entity[this.gstore.ds.KEY]);
                    // We only need to clear the Queries from the cache once,
                    // so we do it on the first batch.
                    const clearQueries = currentBatch === 0;
                    return this.delete(undefined, undefined, undefined, undefined, keys, { clearQueries }).then(onEntitiesDeleted);
                };
                const onQueryResponse = (data) => {
                    ({ entities } = data);
                    if (entities.length === 0) {
                        // No more Data in table
                        return Promise.resolve({
                            success: true,
                            message: `All ${this.entityKind} deleted successfully.`,
                        });
                    }
                    currentBatch = 0;
                    // We calculate the total batches we will need to process
                    // The Datastore does not allow more than 500 keys at once when deleting.
                    totalBatches = Math.ceil(entities.length / maxEntitiesPerBatch);
                    return deleteEntities(currentBatch);
                };
                // We query only limit number in case of big table
                // If we query with more than million data query will hang up
                const query = this.query(namespace);
                if (ancestors) {
                    query.hasAncestor(this.gstore.ds.key(ancestors.slice()));
                }
                query.select('__key__');
                query.limit(QUERY_LIMIT);
                return query.run({ cache: false }).then(onQueryResponse);
            };
            return runQueryAndDeleteEntities();
        }
        static clearCache(keys, clearQueries = true) {
            const handlers = [];
            if (clearQueries) {
                handlers.push(this.gstore.cache.queries.clearQueriesByKind(this.entityKind).catch((e) => {
                    if (e.code === 'ERR_NO_REDIS') {
                        // Silently fail if no Redis Client
                        return;
                    }
                    throw e;
                }));
            }
            if (keys) {
                const keysArray = (0, arrify_1.default)(keys);
                handlers.push(this.gstore.cache.keys.del(...keysArray));
            }
            return Promise.all(handlers).then(() => ({ success: true }));
        }
        static excludeFromIndexes(properties) {
            properties = (0, arrify_1.default)(properties);
            properties.forEach((prop) => {
                let definition;
                if (!{}.hasOwnProperty.call(this.schema.paths, prop)) {
                    definition = { optional: true, excludeFromIndexes: true };
                    this.schema.path(prop, definition);
                }
                else {
                    definition = this.schema.paths[prop];
                    definition.excludeFromIndexes = true;
                }
                this.schema.updateExcludedFromIndexesMap(prop, definition);
            });
        }
        static sanitize(data, options = { disabled: [] }) {
            const key = data[this.gstore.ds.KEY]; // save the Key
            if (!is_1.default.object(data)) {
                return {};
            }
            const isJoiSchema = schema.isJoi;
            let sanitized;
            let joiOptions;
            if (isJoiSchema) {
                const { error, value } = schema.validateJoi(data);
                if (!error) {
                    sanitized = { ...value };
                }
                joiOptions = schema.options.joi.options || {};
            }
            if (sanitized === undefined) {
                sanitized = { ...data };
            }
            const isSchemaExplicitOnly = isJoiSchema ? joiOptions.stripUnknown : schema.options.explicitOnly === true;
            const isWriteDisabled = options.disabled.includes('write');
            const hasSchemaRefProps = Boolean(schema.__meta.refProps);
            let schemaHasProperty;
            let isPropWritable;
            let propValue;
            Object.keys(data).forEach((k) => {
                schemaHasProperty = {}.hasOwnProperty.call(schema.paths, k);
                isPropWritable = schemaHasProperty ? schema.paths[k].write !== false : true;
                propValue = sanitized[k];
                if ((isSchemaExplicitOnly && !schemaHasProperty) || (!isPropWritable && !isWriteDisabled)) {
                    delete sanitized[k];
                }
                else if (propValue === 'null') {
                    sanitized[k] = null;
                }
                else if (hasSchemaRefProps && schema.__meta.refProps[k] && !this.gstore.ds.isKey(propValue)) {
                    // Replace populated entity by their entity Key
                    if (is_1.default.object(propValue) && propValue[this.gstore.ds.KEY]) {
                        sanitized[k] = propValue[this.gstore.ds.KEY];
                    }
                }
            });
            return key ? { ...sanitized, [this.gstore.ds.KEY]: key } : sanitized;
        }
        // ------------------------------------
        // Private methods
        // ------------------------------------
        static __compile(newKind, newSchema) {
            return (0, exports.generateModel)(newKind, newSchema, gstore);
        }
        static __fetchEntityByKey(key, transaction, dataloader, options) {
            const handler = (keys) => {
                const keysArray = (0, arrify_1.default)(keys);
                if (transaction) {
                    if (transaction.constructor.name !== 'Transaction') {
                        return Promise.reject(new Error('Transaction needs to be a gcloud Transaction'));
                    }
                    return transaction.get(keysArray).then(([result]) => (0, arrify_1.default)(result));
                }
                if (dataloader) {
                    if (dataloader.constructor.name !== 'DataLoader') {
                        return Promise.reject(new errors_1.GstoreError(errors_1.ERROR_CODES.ERR_GENERIC, 'dataloader must be a "DataLoader" instance'));
                    }
                    return dataloader.loadMany(keysArray).then((result) => (0, arrify_1.default)(result));
                }
                return this.gstore.ds.get(keys).then(([result]) => {
                    if (Array.isArray(keys)) {
                        return (0, arrify_1.default)(result);
                    }
                    return result;
                });
            };
            if (this.__hasCache(options)) {
                return this.gstore.cache.keys.read(
                // nsql-cache requires an array for multiple and a single key when *not* multiple
                Array.isArray(key) && key.length === 1 ? key[0] : key, options, handler);
            }
            return handler(key);
        }
        // Helper to know if the cache is "on" when fetching entities
        static __hasCache(options = {}, type = 'keys') {
            if (typeof this.gstore.cache === 'undefined') {
                return false;
            }
            if (typeof options.cache !== 'undefined') {
                return options.cache;
            }
            if (this.gstore.cache.config.global === false) {
                return false;
            }
            if (this.gstore.cache.config.ttl[type] === -1) {
                return false;
            }
            return true;
        }
        static __populate(refs, options = {}) {
            const dataloader = options.dataloader || this.gstore.createDataLoader();
            const getPopulateMetaForEntity = (entity, entityRefs) => {
                const keysToFetch = [];
                const mapKeyToPropAndSelect = {};
                const isEntityClass = entity instanceof entity_1.default;
                entityRefs.forEach((ref) => {
                    const { path } = ref;
                    const entityData = isEntityClass ? entity.entityData : entity;
                    const key = (0, lodash_1.get)(entityData, path);
                    if (!key) {
                        (0, lodash_1.set)(entityData, path, null);
                        return;
                    }
                    if (!this.gstore.ds.isKey(key)) {
                        throw new Error(`[gstore] ${path} is not a Datastore Key. Reference entity can't be fetched.`);
                    }
                    // Stringify the key
                    const strKey = keyToString(key);
                    // Add it to our map
                    mapKeyToPropAndSelect[strKey] = { ref };
                    // Add to our array to be fetched
                    keysToFetch.push(key);
                });
                return { entity, keysToFetch, mapKeyToPropAndSelect };
            };
            const populateFn = (entitiesToProcess) => {
                if (!refs || !refs.length || entitiesToProcess === null) {
                    // Nothing to do here...
                    return Promise.resolve(entitiesToProcess);
                }
                // Keep track if we provided an array for the response format
                const isArray = Array.isArray(entitiesToProcess);
                const entities = (0, arrify_1.default)(entitiesToProcess);
                const isEntityClass = entities[0] instanceof entity_1.default;
                // Fetches the entity references at the current
                // object tree depth
                const fetchRefsEntitiesRefsAtLevel = (entityRefs) => {
                    // For each one of the entities to process, we gatter some meta data
                    // like the keys to fetch for that entity in order to populate its refs.
                    // Dataloaader will take care to only fetch unique keys on the Datastore
                    const meta = entities.map((entity) => getPopulateMetaForEntity(entity, entityRefs));
                    const onKeysFetched = (response, { entity, keysToFetch, mapKeyToPropAndSelect }) => {
                        if (!response) {
                            // No keys have been fetched
                            return;
                        }
                        const entityData = isEntityClass ? { ...entity.entityData } : entity;
                        const mergeRefEntitiesToEntityData = (data, i) => {
                            const key = keysToFetch[i];
                            const strKey = keyToString(key);
                            const { ref: { path, select }, } = mapKeyToPropAndSelect[strKey];
                            if (!data) {
                                (0, lodash_1.set)(entityData, path, data);
                                return;
                            }
                            const EmbeddedModel = this.gstore.model(key.kind);
                            const embeddedEntity = new EmbeddedModel(data, undefined, undefined, undefined, key);
                            // prettier-ignore
                            // If "select" fields are provided, we return them,
                            // otherwise we return the entity plain() json
                            const json = select.length && !select.some(s => s === '*')
                                ? select.reduce((acc, field) => {
                                    acc = {
                                        ...acc,
                                        [field]: data[field] || null,
                                    };
                                    return acc;
                                }, {})
                                : embeddedEntity.plain();
                            (0, lodash_1.set)(entityData, path, { ...json, id: key.name || key.id });
                            if (isEntityClass) {
                                entity.entityData = entityData;
                            }
                        };
                        // Loop over all dataloader.loadMany() responses
                        response.forEach(mergeRefEntitiesToEntityData);
                    };
                    const promises = meta.map(({ keysToFetch }) => keysToFetch.length
                        ? this.__fetchEntityByKey(keysToFetch, options.transaction, dataloader, options)
                        : Promise.resolve(null));
                    return Promise.all(promises).then((result) => {
                        // Loop over all responses from dataloader.loadMany() calls
                        result.forEach((res, i) => onKeysFetched(res, meta[i]));
                    });
                };
                return new Promise((resolve, reject) => {
                    // At each tree level we fetch the entity references in series.
                    refs
                        .reduce((chainedPromise, entityRefs) => chainedPromise.then(() => fetchRefsEntitiesRefsAtLevel(entityRefs)), Promise.resolve())
                        .then(() => {
                        resolve(isArray ? entities : entities[0]);
                    })
                        .catch(reject);
                });
            };
            return populateFn;
        }
        // Add "post" hooks to a transaction
        static __hooksTransaction(transaction, postHooks) {
            const _this = this; // eslint-disable-line @typescript-eslint/no-this-alias
            postHooks = (0, arrify_1.default)(postHooks);
            if (!{}.hasOwnProperty.call(transaction, 'hooks')) {
                transaction.hooks = {
                    post: [],
                };
            }
            transaction.hooks.post = [...transaction.hooks.post, ...postHooks];
            transaction.execPostHooks = function executePostHooks() {
                if (!this.hooks.post) {
                    return Promise.resolve();
                }
                return this.hooks.post.reduce((promise, hook) => promise.then(hook.bind(_this)), Promise.resolve());
            };
        }
        // Helper to change the function scope (the "this" value) for a hook if necessary
        // TODO: Refactor this in promised-hook to make this behaviour more declarative.
        static __scopeHook(hook, args, hookName, hookType) {
            /**
             * For "delete" hooks we want to set the scope to
             * the entity instance we are going to delete
             * We won't have any entity data inside the entity but, if needed,
             * we can then call the "datastoreEntity()" helper on the scope (this)
             * from inside the hook.
             * For "multiple" ids to delete, we obviously can't set any scope.
             */
            const getScopeForDeleteHooks = () => {
                const id = is_1.default.object(args[0]) && {}.hasOwnProperty.call(args[0], '__override') ? (0, arrify_1.default)(args[0].__override)[0] : args[0];
                if (is_1.default.array(id)) {
                    return null;
                }
                let ancestors;
                let namespace;
                let key;
                if (hookType === 'post') {
                    ({ key } = args);
                    if (is_1.default.array(key)) {
                        return null;
                    }
                }
                else {
                    ({ 1: ancestors, 2: namespace, 4: key } = args);
                }
                if (!id && !ancestors && !namespace && !key) {
                    return undefined;
                }
                return new this({}, id, ancestors, namespace, key);
            };
            switch (hook) {
                case 'delete':
                    return getScopeForDeleteHooks();
                default:
                    return this;
            }
        }
        // -----------------------------------------------------------
        // Other properties and methods attached to the Model Class
        // -----------------------------------------------------------
        static pre; // Is added below when wrapping with hooks
        static post; // Is added below when wrapping with hooks
        static query; // Is added below from the Query instance
        static findOne; // Is added below from the Query instance
        static list; // Is added below from the Query instance
        static findAround; // Is added below from the Query instance
    };
    const query = new query_1.default(model);
    const { initQuery, list, findOne, findAround } = query;
    model.query = initQuery.bind(query);
    model.list = list.bind(query);
    model.findOne = findOne.bind(query);
    model.findAround = findAround.bind(query);
    // Wrap the Model to add "pre" and "post" hooks functionalities
    promised_hooks_1.default.wrap(model);
    registerHooksFromSchema(model, schema);
    return model;
};
exports.generateModel = generateModel;
