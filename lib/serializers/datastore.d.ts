import GstoreEntity from '../entity';
import GstoreModel from '../model';
import { GenericObject, EntityKey, EntityData, DatastoreSaveMethod } from '../types';
declare type ToDatastoreOptions = {
    method?: DatastoreSaveMethod;
};
declare type DatastoreFormat = {
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
    }>>(entityData: EntityData<{
        [key: string]: any;
    }>, Model: GstoreModel<any, {
        [key: string]: import("../types").CustomEntityFunction<any>;
    }>, options?: {
        format?: F | undefined;
        readAll?: boolean | undefined;
        showKey?: boolean | undefined;
    }) => R;
    entitiesToDatastore: <T_1 extends GstoreEntity<GenericObject> | GstoreEntity<GenericObject>[], R_1 = T_1 extends GstoreEntity<GenericObject> ? DatastoreFormat : DatastoreFormat[]>(entities: T_1, options?: ToDatastoreOptions | undefined) => R_1;
};
export default _default;
