declare const _default: {
    queryHelpers: {
        buildQueryFromOptions: <T, Outputformat>(query: import("..").GstoreQuery<import("..").EntityData<T>, Outputformat>, options?: import("..").QueryListOptions<T> | undefined, ds?: import("@google-cloud/datastore").Datastore | undefined) => import("..").GstoreQuery<import("..").EntityData<T>, Outputformat>;
        createDatastoreQueryForModel: <T_1 extends object, M extends object>(model: import("../model").Model<T_1, M>, namespace?: string | undefined, transaction?: import("@google-cloud/datastore/build/src/transaction").Transaction | undefined) => import("@google-cloud/datastore/build/src/query").Query;
    };
    validation: {
        validate: <T_2 extends object>(entityData: import("..").EntityData<{
            [key: string]: any;
        }>, schema: import("../schema").default<T_2, {
            [key: string]: import("../types").CustomEntityFunction<T_2>;
        }>, entityKind: string, datastore: import("@google-cloud/datastore").Datastore) => import("./validation").ValidateResponse;
    };
    populateHelpers: {
        addPathToPopulateRefs: (initialPath: string, _select: string | string[] | undefined, refs: import("../types").PopulateRef[][]) => void;
        populateFactory: <T_3 extends object>(refsToPopulate: import("../types").PopulateRef[][], promise: Promise<any>, schema: import("../schema").default<T_3, {
            [key: string]: import("../types").CustomEntityFunction<T_3>;
        }>) => import("./populateHelpers").PopulateHandler;
    };
    schemaHelpers: {
        extractMetaFromSchema: <T_4 extends object>(paths: { [P in keyof T_4]: import("..").SchemaPathDefinition; }) => import("../types").GenericObject;
    };
};
export default _default;
