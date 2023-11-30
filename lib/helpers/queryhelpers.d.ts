import { Datastore, Transaction, Query as DatastoreQuery } from '@google-cloud/datastore';
import { GstoreQuery, QueryListOptions } from '../query';
import { EntityData } from '../types';
import Model from '../model';
declare const _default: {
    buildQueryFromOptions: <T, Outputformat>(query: GstoreQuery<EntityData<T>, Outputformat>, options?: QueryListOptions<T> | undefined, ds?: Datastore | undefined) => GstoreQuery<EntityData<T>, Outputformat>;
    createDatastoreQueryForModel: <T_1 extends object, M extends object>(model: Model<T_1, M>, namespace?: string | undefined, transaction?: Transaction | undefined) => DatastoreQuery;
};
export default _default;
