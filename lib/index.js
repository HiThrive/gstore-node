"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERIES_FORMATS = exports.instances = exports.Gstore = void 0;
const is_1 = __importDefault(require("is"));
const extend_1 = __importDefault(require("extend"));
const promised_hooks_1 = __importDefault(require("promised-hooks"));
const nsql_cache_1 = __importDefault(require("nsql-cache"));
const nsql_cache_datastore_1 = __importDefault(require("nsql-cache-datastore"));
const package_json_1 = __importDefault(require("../package.json"));
const schema_1 = __importDefault(require("./schema"));
const model_1 = require("./model");
const defaultValues_1 = __importDefault(require("./helpers/defaultValues"));
const errors_1 = require("./errors");
const serializers_1 = require("./serializers");
const dataloader_1 = require("./dataloader");
const DEFAULT_GSTORE_CONFIG = {
    cache: undefined,
    errorOnEntityNotFound: true,
};
const DEFAULT_CACHE_SETTINGS = {
    config: {
        wrapClient: false,
    },
};
class Gstore {
    constructor(config = {}) {
        this.__pkgVersion = package_json_1.default.version;
        if (!is_1.default.object(config)) {
            throw new Error('Gstore config must be an object.');
        }
        this.models = {};
        this.config = { ...DEFAULT_GSTORE_CONFIG, ...config };
        this.Schema = schema_1.default;
        this.__defaultValues = defaultValues_1.default;
        // this.__pkgVersion = pkg.version;
        this.errors = {
            GstoreError: errors_1.GstoreError,
            ValidationError: errors_1.ValidationError,
            TypeError: errors_1.TypeError,
            ValueError: errors_1.ValueError,
            codes: errors_1.ERROR_CODES,
        };
        this.ERR_HOOKS = promised_hooks_1.default.ERRORS;
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
            if (schema instanceof schema_1.default && schema !== undefined) {
                throw new Error(`Trying to override ${entityKind} Model Schema`);
            }
            return this.models[entityKind];
        }
        if (!schema) {
            throw new Error('A Schema needs to be provided to create a Model.');
        }
        const model = (0, model_1.generateModel)(entityKind, schema, this);
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
        const entitiesSerialized = serializers_1.datastoreSerializer.entitiesToDatastore(entities, options);
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
                ? (0, extend_1.default)(true, {}, DEFAULT_CACHE_SETTINGS)
                : (0, extend_1.default)(true, {}, DEFAULT_CACHE_SETTINGS, this.config.cache);
            const { stores, config } = cacheSettings;
            const db = (0, nsql_cache_datastore_1.default)(datastore);
            this.cache = new nsql_cache_1.default({ db, stores, config });
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
        return (0, dataloader_1.createDataLoader)(this.ds);
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
exports.Gstore = Gstore;
exports.instances = {
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
var constants_1 = require("./constants");
Object.defineProperty(exports, "QUERIES_FORMATS", { enumerable: true, get: function () { return constants_1.QUERIES_FORMATS; } });
exports.default = Gstore;
