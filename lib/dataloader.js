"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataLoader = void 0;
const optional_1 = __importDefault(require("optional"));
const arrify_1 = __importDefault(require("arrify"));
const nsql_cache_datastore_1 = __importDefault(require("nsql-cache-datastore"));
const OptionalDataloader = (0, optional_1.default)('dataloader');
const dsAdapter = (0, nsql_cache_datastore_1.default)();
const { keyToString } = dsAdapter;
/**
 * Create a DataLoader instance
 * @param {Datastore} ds @google-cloud Datastore instance
 */
const createDataLoader = (ds, options) => {
    if (!ds) {
        throw new Error('A Datastore instance has to be passed');
    }
    const fetchHandler = (keys) => ds.get(keys).then(([response]) => {
        // When providing an Array with 1 Key item, google-datastore
        // returns a single item.
        // For predictable results in gstore, all responses from Datastore.get()
        // calls return an Array
        const entityData = (0, arrify_1.default)(response);
        const entitiesByKey = {};
        entityData.forEach((data) => {
            entitiesByKey[keyToString(data[ds.KEY])] = data;
        });
        return keys.map((key) => entitiesByKey[keyToString(key)] || null);
    });
    const defaultOptions = {
        cacheKeyFn: (key) => keyToString(key),
        maxBatchSize: 1000,
    };
    return new OptionalDataloader(fetchHandler, { ...defaultOptions, ...options });
};
exports.createDataLoader = createDataLoader;
