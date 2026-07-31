import { Datastore, Transaction, Query as DatastoreQuery } from '@google-cloud/datastore';
import { GstoreQuery, QueryListOptions } from '../query';
import { EntityData } from '../types';
import Model from '../model';
declare const _default: {
    buildQueryFromOptions: <T, Outputformat>(query: GstoreQuery<EntityData<T>, Outputformat>, options?: QueryListOptions<T>, ds?: Datastore) => GstoreQuery<EntityData<T>, Outputformat>;
    createDatastoreQueryForModel: <T extends object, M extends object>(model: Model<T, M>, namespace?: string, transaction?: Transaction) => DatastoreQuery;
};
export default _default;
