import { entity } from '@google-cloud/datastore/build/src/entity';
import GstoreEntity from './entity';
export declare type EntityKey = entity.Key;
export declare type EntityData<T = {
    [key: string]: any;
}> = {
    [P in keyof T]: T[P];
};
export declare type FuncReturningPromise = (...args: any[]) => Promise<any>;
export declare type FunctionType = (...args: any[]) => any;
export declare type CustomEntityFunction<T extends object> = (this: GstoreEntity<T>, ...args: any[]) => any;
export declare type GenericObject = {
    [key: string]: any;
};
export declare type IdType = string | number;
export declare type Ancestor = IdType[];
export declare type EntityFormatType = 'ENTITY';
export declare type JSONFormatType = 'JSON';
export declare type DatastoreSaveMethod = 'upsert' | 'insert' | 'update';
export declare type PopulateRef = {
    path: string;
    select: string[];
};
export declare type PopulateMetaForEntity = {
    entity: GstoreEntity | EntityData;
    keysToFetch: EntityKey[];
    mapKeyToPropAndSelect: {
        [key: string]: {
            ref: PopulateRef;
        };
    };
};
export declare type PopulateFunction<T extends object> = (entitiesToProcess: null | GstoreEntity<T> | Array<GstoreEntity<T> | EntityData<T> | null>) => Promise<GstoreEntity<T> | EntityData<T> | null | Array<GstoreEntity<T> | EntityData<T> | null>>;
export interface PromiseWithPopulate<T> extends Promise<T> {
    populate: <U extends string | string[]>(refs?: U, properties?: U extends Array<string> ? never : string | string[]) => PromiseWithPopulate<T>;
}
/**
 * ---------------------------------------------------
 * Google Datastore Types
 * ---------------------------------------------------
 */
export declare type DatastoreOperator = '=' | '<' | '>' | '<=' | '>=' | 'HAS_ANCESTOR';
export interface OrderOptions {
    descending?: boolean;
}
