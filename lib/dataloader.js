import optional from 'optional';
import arrify from 'arrify';
import datastoreAdapterFactory from 'nsql-cache-datastore';
const OptionalDataloader = optional('dataloader');
const dsAdapter = datastoreAdapterFactory();
const { keyToString } = dsAdapter;
/**
 * Create a DataLoader instance
 * @param {Datastore} ds @google-cloud Datastore instance
 */
export const createDataLoader = (ds, options) => {
    if (!ds) {
        throw new Error('A Datastore instance has to be passed');
    }
    const fetchHandler = (keys) => ds.get(keys).then(([response]) => {
        // When providing an Array with 1 Key item, google-datastore
        // returns a single item.
        // For predictable results in gstore, all responses from Datastore.get()
        // calls return an Array
        const entityData = arrify(response);
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
