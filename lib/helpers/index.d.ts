import * as path from './path';
declare const _default: {
    queryHelpers: {
        buildQueryFromOptions: <T, Outputformat>(query: import("..").GstoreQuery<import("..").EntityData<T>, Outputformat>, options?: import("..").QueryListOptions<T>, ds?: import("@google-cloud/datastore").Datastore) => import("..").GstoreQuery<import("..").EntityData<T>, Outputformat>;
        createDatastoreQueryForModel: <T extends object, M extends object>(model: import("../model").Model<T, M>, namespace?: string, transaction?: import("@google-cloud/datastore").Transaction) => import("@google-cloud/datastore").Query;
    };
    validation: {
        validate: <T extends object>(entityData: import("..").EntityData, schema: import("../schema").default<T>, entityKind: string, datastore: import("@google-cloud/datastore").Datastore) => import("./validation").ValidateResponse;
    };
    populateHelpers: {
        addPathToPopulateRefs: (initialPath: string, _select: string | string[] | never | undefined, refs: import("../types").PopulateRef[][]) => void;
        populateFactory: <T extends object>(refsToPopulate: import("../types").PopulateRef[][], promise: Promise<any>, schema: import("../schema").default<T>) => import("./populateHelpers").PopulateHandler;
    };
    schemaHelpers: {
        extractMetaFromSchema: <T extends object>(paths: import("../schema").default<T>["paths"]) => import("../types").GenericObject;
    };
    path: typeof path;
};
export default _default;
