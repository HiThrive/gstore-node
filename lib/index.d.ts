import NsqlCache, { NsqlCacheConfig } from 'nsql-cache';
import DataLoader from 'dataloader';
import { Datastore, Transaction } from '@google-cloud/datastore';
import GstoreSchema from './schema';
import GstoreEntity, { Entity as EntityType } from './entity';
import GstoreModel from './model';
import { DefaultValues } from './helpers/defaultValues';
import { GstoreError, ValidationError, TypeError, ValueError, ERROR_CODES } from './errors';
import { EntityKey as EntityKeyType, EntityData as EntityDataType, DatastoreSaveMethod, CustomEntityFunction, GenericObject } from './types';
export interface CacheConfig {
    stores?: any[];
    config: NsqlCacheConfig;
}
export interface GstoreConfig {
    cache?: boolean | CacheConfig;
    /**
     * If set to `true` (defaut), when fetching an entity by key and the entity is not found in the Datastore,
     * gstore will throw an `"ERR_ENTITY_NOT_FOUND"` error.
     * If set to `false`, `null` will be returned
     */
    errorOnEntityNotFound?: boolean;
}
export declare class Gstore {
    /**
     * Map of Gstore Model created
     */
    models: {
        [key: string]: GstoreModel<any>;
    };
    /**
     * Gstore Schema class
     */
    Schema: typeof GstoreSchema;
    /**
     * Gstore instance configuration
     */
    config: GstoreConfig;
    /**
     * The underlying gstore-cache instance
     */
    cache: NsqlCache | undefined;
    /**
     * The symbol to access possible errors thrown
     * in a "post" hooks
     */
    ERR_HOOKS: symbol;
    errors: {
        GstoreError: typeof GstoreError;
        ValidationError: typeof ValidationError;
        TypeError: typeof TypeError;
        ValueError: typeof ValueError;
        codes: typeof ERROR_CODES;
    };
    __ds: Datastore | undefined;
    __defaultValues: DefaultValues;
    __pkgVersion: string;
    constructor(config?: GstoreConfig);
    /**
     * Create or access a gstore Model
     *
     * @param {string} entityKind The Google Entity Kind
     * @param {Schema} schema A gstore schema instance
     * @returns {Model} A gstore Model
     */
    model<T extends object, M extends object = {
        [key: string]: CustomEntityFunction<T>;
    }>(entityKind: string, schema?: GstoreSchema<T, M>): GstoreModel<T, M>;
    /**
     * Initialize a @google-cloud/datastore Transaction
     */
    transaction(): Transaction;
    /**
     * Return an array of model names created on this instance of Gstore
     * @returns {Array}
     */
    modelNames(): string[];
    /**
     * Alias to the underlying @google-cloud/datastore `save()` method
     * but instead of passing entity _keys_ this methods accepts one or multiple gstore **_entity_** instance(s).
     *
     * @param {(GstoreEntity | GstoreEntity[])} entity The entity(ies) to delete (any Entity Kind). Can be one or many (Array).
     * @param {Transaction} [transaction] An Optional transaction to save the entities into
     * @returns {Promise<any>}
     * @link https://sebloix.gitbook.io/gstore-node/gstore-methods/save
     */
    save(entities: GstoreEntity | GstoreEntity[], transaction?: Transaction, options?: {
        method?: DatastoreSaveMethod;
        validate?: boolean;
    } | undefined): Promise<[{
        mutationResults?: any;
        indexUpdates?: number | null;
    }] | void>;
    /**
     * Connect gstore node to the Datastore instance
     *
     * @param {Datastore} datastore A Datastore instance
     */
    connect(datastore: any): void;
    /**
     * Create a DataLoader instance.
     * Follow the link below for more info about Dataloader.
     *
     * @returns {DataLoader} The DataLoader instance
     * @link https://sebloix.gitbook.io/gstore-node/cache-dataloader/dataloader
     */
    createDataLoader(): DataLoader<EntityKeyType, EntityDataType>;
    /**
     * Default values for schema properties
     */
    get defaultValues(): DefaultValues;
    get version(): string;
    /**
     * The unerlying google-cloud Datastore instance
     */
    get ds(): Datastore;
}
export declare const instances: {
    __refs: Map<string, Gstore>;
    /**
     * Retrieve a previously saved gstore instance.
     *
     * @param id The instance id
     */
    get(id: string): Gstore;
    /**
     * Save a gstore instance.
     *
     * @param id A unique name for the gstore instance
     * @param instance A gstore instance
     */
    set(id: string, instance: Gstore): void;
};
export declare type Entity<T extends object = GenericObject> = EntityType<T>;
export declare type Model<T extends object = GenericObject, M extends object = {
    [key: string]: CustomEntityFunction<T>;
}> = GstoreModel<T, M>;
export declare type Schema<T extends object = {
    [key: string]: any;
}, M extends object = {
    [key: string]: CustomEntityFunction<T>;
}> = GstoreSchema<T, M>;
export { QUERIES_FORMATS } from './constants';
export { ValidateResponse } from './helpers/validation';
export { SchemaPathDefinition, SchemaOptions, PropType } from './schema';
export { EntityData, EntityKey, IdType } from './types';
export { QueryListOptions, QueryFindAroundOptions, QueryOptions, QueryResponse, GstoreQuery } from './query';
export default Gstore;
