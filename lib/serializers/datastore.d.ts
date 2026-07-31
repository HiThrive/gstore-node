import GstoreEntity from '../entity';
import GstoreModel from '../model';
import { GenericObject, EntityKey, EntityData, DatastoreSaveMethod } from '../types';
type ToDatastoreOptions = {
    method?: DatastoreSaveMethod;
};
type DatastoreFormat = {
    key: EntityKey;
    data: EntityData;
    excludeLargeProperties?: boolean;
    excludeFromIndexes?: string[];
    method?: DatastoreSaveMethod;
};
declare const _default: {
    toDatastore: <T extends object>(entity: GstoreEntity<T>, options?: ToDatastoreOptions | undefined) => DatastoreFormat;
    fromDatastore: <F extends "JSON" | "ENTITY" = "JSON", R = F extends "ENTITY" ? GstoreEntity<GenericObject> : EntityData<{
        [key: string]: any;
    }>>(entityData: EntityData, Model: GstoreModel<any>, options?: {
        format?: F;
        readAll?: boolean;
        showKey?: boolean;
    }) => R;
    entitiesToDatastore: <T extends GstoreEntity | GstoreEntity[], R = T extends GstoreEntity<GenericObject> ? DatastoreFormat : DatastoreFormat[]>(entities: T, options?: ToDatastoreOptions | undefined) => R;
};
export default _default;
