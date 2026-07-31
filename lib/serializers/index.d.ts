export declare const datastoreSerializer: {
    toDatastore: <T extends object>(entity: import("../entity").GstoreEntity<T>, options?: {
        method?: import("../types").DatastoreSaveMethod;
    } | undefined) => {
        key: import("..").EntityKey;
        data: import("..").EntityData;
        excludeLargeProperties?: boolean;
        excludeFromIndexes?: string[];
        method?: import("../types").DatastoreSaveMethod;
    };
    fromDatastore: <F extends "JSON" | "ENTITY" = "JSON", R = F extends "ENTITY" ? import("../entity").GstoreEntity<import("../types").GenericObject> : import("..").EntityData<{
        [key: string]: any;
    }>>(entityData: import("..").EntityData, Model: import("../model").Model<any>, options?: {
        format?: F;
        readAll?: boolean;
        showKey?: boolean;
    }) => R;
    entitiesToDatastore: <T extends import("../entity").GstoreEntity | import("../entity").GstoreEntity[], R = T extends import("../entity").GstoreEntity<import("../types").GenericObject> ? {
        key: import("..").EntityKey;
        data: import("..").EntityData;
        excludeLargeProperties?: boolean;
        excludeFromIndexes?: string[];
        method?: import("../types").DatastoreSaveMethod;
    } : {
        key: import("..").EntityKey;
        data: import("..").EntityData;
        excludeLargeProperties?: boolean;
        excludeFromIndexes?: string[];
        method?: import("../types").DatastoreSaveMethod;
    }[]>(entities: T, options?: {
        method?: import("../types").DatastoreSaveMethod;
    } | undefined) => R;
};
