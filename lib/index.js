import is from 'is';
import extend from 'extend';
import hooks from 'promised-hooks';
import NsqlCache from 'nsql-cache';
import dsAdapter from 'nsql-cache-datastore';
import pkg from '../package.json';
import GstoreSchema from './schema';
import { generateModel } from './model';
import defaultValues from './helpers/defaultValues';
import { GstoreError, ValidationError, TypeError, ValueError, ERROR_CODES } from './errors';
import { datastoreSerializer } from './serializers';
import { createDataLoader } from './dataloader';
const DEFAULT_GSTORE_CONFIG = {
    cache: undefined,
    errorOnEntityNotFound: true,
};
const DEFAULT_CACHE_SETTINGS = {
    config: {
        wrapClient: false,
    },
};
export class Gstore {
    /**
     * Map of Gstore Model created
     */
    models;
    /**
     * Gstore Schema class
     */
    Schema;
    /**
     * Gstore instance configuration
     */
    config;
    /**
     * The underlying gstore-cache instance
     */
    cache;
    /**
     * The symbol to access possible errors thrown
     * in a "post" hooks
     */
    ERR_HOOKS;
    errors;
    __ds;
    __defaultValues;
    __pkgVersion = pkg.version;
    constructor(config = {}) {
        if (!is.object(config)) {
            throw new Error('Gstore config must be an object.');
        }
        this.models = {};
        this.config = { ...DEFAULT_GSTORE_CONFIG, ...config };
        this.Schema = GstoreSchema;
        this.__defaultValues = defaultValues;
        // this.__pkgVersion = pkg.version;
        this.errors = {
            GstoreError,
            ValidationError,
            TypeError,
            ValueError,
            codes: ERROR_CODES,
        };
        this.ERR_HOOKS = hooks.ERRORS;
    }
    /**
     * Create or access a gstore Model
     *
     * @param {string} entityKind The Google Entity Kind
     * @param {Schema} schema A gstore schema instance
     * @returns {Model} A gstore Model
     */
    model(entityKind, schema) {
        if (this.models[entityKind]) {
            // Don't allow overriding Model schema
            if (schema instanceof GstoreSchema && schema !== undefined) {
                throw new Error(`Trying to override ${entityKind} Model Schema`);
            }
            return this.models[entityKind];
        }
        if (!schema) {
            throw new Error('A Schema needs to be provided to create a Model.');
        }
        const model = generateModel(entityKind, schema, this);
        this.models[entityKind] = model;
        return this.models[entityKind];
    }
    /**
     * Initialize a @google-cloud/datastore Transaction
     */
    transaction() {
        return this.ds.transaction();
    }
    /**
     * Return an array of model names created on this instance of Gstore
     * @returns {Array}
     */
    modelNames() {
        const names = Object.keys(this.models);
        return names;
    }
    /**
     * Alias to the underlying @google-cloud/datastore `save()` method
     * but instead of passing entity _keys_ this methods accepts one or multiple gstore **_entity_** instance(s).
     *
     * @param {(GstoreEntity | GstoreEntity[])} entity The entity(ies) to delete (any Entity Kind). Can be one or many (Array).
     * @param {Transaction} [transaction] An Optional transaction to save the entities into
     * @returns {Promise<any>}
     * @link https://sebloix.gitbook.io/gstore-node/gstore-methods/save
     */
    save(entities, transaction, options = {}) {
        if (!entities) {
            throw new Error('No entities passed');
        }
        const serializeAndValidateEntity = (entity) => {
            entity.serializeEntityData();
            if (options.validate) {
                const { error } = entity.validate();
                if (error) {
                    throw error;
                }
            }
        };
        try {
            if (Array.isArray(entities)) {
                entities.forEach(serializeAndValidateEntity);
            }
            else {
                serializeAndValidateEntity(entities);
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        // Convert gstore entities to datastore forma ({key, data})
        const entitiesSerialized = datastoreSerializer.entitiesToDatastore(entities, options);
        if (transaction) {
            return Promise.resolve(transaction.save(entitiesSerialized));
        }
        // We forward the call to google-datastore
        return this.ds.save(entitiesSerialized);
    }
    /**
     * Connect gstore node to the Datastore instance
     *
     * @param {Datastore} datastore A Datastore instance
     */
    connect(datastore) {
        if (!datastore.constructor || datastore.constructor.name !== 'Datastore') {
            throw new Error('No @google-cloud/datastore instance provided.');
        }
        this.__ds = datastore;
        if (this.config.cache) {
            const cacheSettings = this.config.cache === true
                ? extend(true, {}, DEFAULT_CACHE_SETTINGS)
                : extend(true, {}, DEFAULT_CACHE_SETTINGS, this.config.cache);
            const { stores, config } = cacheSettings;
            const db = dsAdapter(datastore);
            this.cache = new NsqlCache({ db, stores, config });
            delete this.config.cache;
        }
    }
    /**
     * Create a DataLoader instance.
     * Follow the link below for more info about Dataloader.
     *
     * @returns {DataLoader} The DataLoader instance
     * @link https://sebloix.gitbook.io/gstore-node/cache-dataloader/dataloader
     */
    createDataLoader() {
        return createDataLoader(this.ds);
    }
    /**
     * Default values for schema properties
     */
    get defaultValues() {
        return this.__defaultValues;
    }
    get version() {
        return this.__pkgVersion;
    }
    /**
     * The unerlying google-cloud Datastore instance
     */
    get ds() {
        if (this.__ds === undefined) {
            throw new Error('Trying to access Datastore instance but none was provided.');
        }
        return this.__ds;
    }
}
export const instances = {
    __refs: new Map(),
    /**
     * Retrieve a previously saved gstore instance.
     *
     * @param id The instance id
     */
    get(id) {
        const instance = this.__refs.get(id);
        if (!instance) {
            throw new Error(`Could not find gstore instance with id "${id}"`);
        }
        return instance;
    },
    /**
     * Save a gstore instance.
     *
     * @param id A unique name for the gstore instance
     * @param instance A gstore instance
     */
    set(id, instance) {
        this.__refs.set(id, instance);
    },
};
export { QUERIES_FORMATS } from './constants';
export default Gstore;
