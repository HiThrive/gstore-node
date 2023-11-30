export declare const datastoreSerializer: {
    toDatastore: <T extends object>(entity: import("../entity").GstoreEntity<T>, options?: {
        method?: "insert" | "update" | "upsert" | undefined;
    } | undefined) => {
        key: import("@google-cloud/datastore/build/src/entity").entity.Key;
        data: import("..").EntityData<{
            [key: string]: any;
        }>;
        excludeLargeProperties?: boolean | undefined;
        excludeFromIndexes?: string[] | undefined;
        method?: "insert" | "update" | "upsert" | undefined;
    };
    fromDatastore: <F extends "JSON" | "ENTITY" = "JSON", R = F extends "ENTITY" ? import("../entity").GstoreEntity<import("../types").GenericObject> : import("..").EntityData<{
        [key: string]: any;
    }>>(entityData: import("..").EntityData<{
        [key: string]: any;
    }>, Model: import("../model").Model<any, {
        [key: string]: import("../types").CustomEntityFunction<any>;
    }>, options?: {
        format?: F | undefined;
        readAll?: boolean | undefined;
        showKey?: boolean | undefined;
    }) => R;
    entitiesToDatastore: <T_1 extends import("../entity").GstoreEntity<import("../types").GenericObject> | import("../entity").GstoreEntity<import("../types").GenericObject>[], R_1 = T_1 extends import("../entity").GstoreEntity<import("../types").GenericObject> ? {
        key: import("@google-cloud/datastore/build/src/entity").entity.Key;
        data: import("..").EntityData<{
            [key: string]: any;
        }>;
        excludeLargeProperties?: boolean | undefined;
        excludeFromIndexes?: string[] | undefined;
        method?: "insert" | "update" | "upsert" | undefined;
    } : {
        key: import("@google-cloud/datastore/build/src/entity").entity.Key;
        data: import("..").EntityData<{
            [key: string]: any;
        }>;
        excludeLargeProperties?: boolean | undefined;
        excludeFromIndexes?: string[] | undefined;
        method?: "insert" | "update" | "upsert" | undefined;
    }[]>(entities: T_1, options?: {
        method?: "insert" | "update" | "upsert" | undefined;
    } | undefined) => R_1;
};
