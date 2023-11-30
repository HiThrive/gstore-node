import { Transaction } from '@google-cloud/datastore';
import Gstore from './index';
import Schema from './schema';
import { Entity } from './entity';
import Query, { QueryResponse, GstoreQuery } from './query';
import { FuncReturningPromise, CustomEntityFunction, IdType, Ancestor, EntityKey, EntityData, PopulateRef, PopulateFunction, PromiseWithPopulate, GenericObject, JSONFormatType, EntityFormatType } from './types';
export interface Model<T extends object = GenericObject, M extends object = {
    [key: string]: CustomEntityFunction<T>;
}> {
    new (data?: EntityData<T>, id?: IdType, ancestors?: Ancestor, namespace?: string, key?: EntityKey): Entity<T, M>;
    /**
     * The gstore instance
     */
    gstore: Gstore;
    /**
     * The Model Schema
     */
    schema: Schema<T>;
    /**
     * The Model Datastore entity kind
     */
    entityKind: string;
    __hooksEnabled: boolean;
    /**
     * Generates one or several entity key(s) for the Model.
     *
     * @param {(string | number)} id Entity id or name
     * @param {(Array<string | number>)} [ancestors] The entity Ancestors
     * @param {string} [namespace] The entity Namespace
     * @returns {entity.Key}
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/key
     */
    key<U extends IdType | IdType[]>(id?: U, ancestors?: Array<string | number>, namespace?: string): U extends Array<IdType> ? EntityKey[] : EntityKey;
    /**
     * Fetch an Entity from the Datastore by _key_.
     *
     * @param {(string | number | string[] | number[])} id The entity ID
     * @param {(Array<string | number>)} [ancestors] The entity Ancestors
     * @param {string} [namespace] The entity Namespace
     * @param {*} [transaction] The current Datastore Transaction (if any)
     * @param [options] Additional configuration
     * @returns {Promise<any>} The entity fetched from the Datastore
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/get
     */
    get<U extends string | number | Array<string | number>>(id: U, ancestors?: Array<string | number>, namespace?: string, transaction?: Transaction, options?: GetOptions): PromiseWithPopulate<U extends Array<string | number> ? Entity<T, M>[] : Entity<T, M>>;
    /**
     * Update an Entity in the Datastore. This method _partially_ updates an entity data in the Datastore
     * by doing a get() + merge the data + save() inside a Transaction. Unless you set `replace: true` in the parameter options.
     *
     * @param {(string | number)} id Entity id or name
     * @param {*} data The data to update (it will be merged with the data in the Datastore
     * unless options.replace is set to "true")
     * @param {(Array<string | number>)} [ancestors] The entity Ancestors
     * @param {string} [namespace] The entity Namespace
     * @param {*} [transaction] The current transaction (if any)
     * @param {{ dataloader?: any, replace?: boolean }} [options] Additional configuration
     * @returns {Promise<any>} The entity updated in the Datastore
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/update
     */
    update(id: IdType, data: EntityData, ancestors?: Ancestor, namespace?: string, transaction?: Transaction, options?: GenericObject): Promise<Entity<T, M>>;
    /**
     * Delete an Entity from the Datastore
     *
     * @param {(string | number)} id Entity id or name
     * @param {(Array<string | number>)} [ancestors] The entity Ancestors
     * @param {string} [namespace] The entity Namespace
     * @param {*} [transaction] The current transaction (if any)
     * @param {(entity.Key | entity.Key[])} [keys] If you already know the Key, you can provide it instead of passing
     * an id/ancestors/namespace. You might then as well just call "gstore.ds.delete(Key)",
     * but then you would not have the "hooks" triggered in case you have added some in your Schema.
     * @returns {Promise<{ success: boolean, key: entity.Key, apiResponse: any }>}
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/delete
     */
    delete(id?: IdType | IdType[], ancestors?: Ancestor, namespace?: string, transaction?: Transaction, key?: EntityKey | EntityKey[], options?: DeleteOptions): Promise<DeleteResponse>;
    /**
     * Delete all the entities of a Model.
     * It runs a query to fetch the entities by batches of 500 (limit set by the Datastore) and delete them.
     * It then repeat the operation until no more entities are found.
     *
     * @static
     * @param ancestors Optional Ancestors to add to the Query
     * @param namespace Optional Namespace to run the Query into
     * @link https://sebloix.gitbook.io/gstore-node/queries/deleteall
     */
    deleteAll(ancestors?: Ancestor, namespace?: string): Promise<DeleteAllResponse>;
    /**
     * Clear all the Queries from the cache *linked* to the Model Entity Kind.
     * One or multiple keys can also be passed to delete them from the cache. We normally don't have to call this method
     * as gstore-node does it automatically each time an entity is added/edited or deleted.
     *
     * @param {(entity.Key | entity.Key[])} [keys] Optional entity Keys to remove from the cache with the Queries
     * @returns {Promise<void>}
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/clearcache
     */
    clearCache(keys?: EntityKey | EntityKey[]): Promise<{
        success: boolean;
    }>;
    /**
     * Dynamically remove a property from indexes. If you have set `explicityOnly: false` in your Schema options,
     * then all the properties not declared in the Schema will be included in the indexes.
     * This method allows you to dynamically exclude from indexes certain properties.
     *
     * @param {(string | string[])} propName Property name (can be one or an Array of properties)
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/exclude-from-indexes
     */
    excludeFromIndexes(propName: string | string[]): void;
    /**
     * Sanitize the entity data. It will remove all the properties marked as "write: false" on the schema.
     * It will also convert "null" (string) to `null` value.
     *
     * @param {*} data The entity data to sanitize
     * @link https://sebloix.gitbook.io/gstore-node/model/methods/sanitize
     */
    sanitize(data: {
        [propName: string]: any;
    }, options?: {
        disabled: string[];
    }): EntityData<T>;
    /**
     * Initialize a Datastore Query for the Model's entity kind.
     *
     * @param {String} namespace Namespace for the Query
     * @param {Object<Transaction>} transaction The transactioh to execute the query in (optional)
     *
     * @returns {Object} The Datastore query object.
     * @link https://sebloix.gitbook.io/gstore-node/queries/google-cloud-queries
     */
    query<F extends JSONFormatType | EntityFormatType = JSONFormatType, R = F extends EntityFormatType ? QueryResponse<T, Entity<T, M>[]> : QueryResponse<T, EntityData<T>[]>>(namespace?: string, transaction?: Transaction): GstoreQuery<T, R>;
    /**
     * Shortcut for listing entities from a Model. List queries are meant to quickly list entities
     * with predefined settings without having to manually create a query.
     *
     * @param {QueryListOptions} [options]
     * @returns {Promise<EntityData[]>}
     * @link https://sebloix.gitbook.io/gstore-node/queries/list
     */
    list: Query<T, M>['list'];
    /**
     * Quickly find an entity by passing key/value pairs.
     *
     * @param keyValues Key / Values pairs
     * @param ancestors Optional Ancestors to add to the Query
     * @param namespace Optional Namespace to run the Query into
     * @param options Additional configuration.
     * @example
      ```
      UserModel.findOne({ email: 'john[at]snow.com' }).then(...);
      ```
     * @link https://sebloix.gitbook.io/gstore-node/queries/findone
     */
    findOne: Query<T, M>['findOne'];
    /**
     * Find entities before or after an entity based on a property and a value.
     *
     * @param {string} propName The property to look around
     * @param {*} value The property value
     * @param {({ before: number, readAll?:boolean, format?: 'JSON' | 'ENTITY', showKey?: boolean } | { after: number, readAll?:boolean, format?: 'JSON' | 'ENTITY', showKey?: boolean } & QueryOptions)} options Additional configuration
     * @returns {Promise<any>}
     * @example
     ```
      // Find the next 20 post after March 1st 2019
      BlogPost.findAround('publishedOn', '2019-03-01', { after: 20 })
      ```
      * @link https://sebloix.gitbook.io/gstore-node/queries/findaround
     */
    findAround: Query<T, M>['findAround'];
    __compile(kind: string, schema: Schema<T, M>): Model<T, M>;
    __fetchEntityByKey(key: EntityKey, transaction?: Transaction, dataloader?: any, options?: GetOptions): Promise<any>;
    __hasCache(options: {
        cache?: any;
    }, type?: string): boolean;
    __populate(refs?: PopulateRef[][], options?: PopulateOptions): PopulateFunction<T>;
    __hooksTransaction(transaction: Transaction, postHooks: FuncReturningPromise[]): void;
    __scopeHook(hook: string, args: GenericObject, hookName: string, hookType: 'pre' | 'post'): any;
}
/**
 * Dynamically generate a new Gstore Model
 *
 * @param kind The Entity Kind
 * @param schema The Gstore Schema
 * @param gstore The Gstore instance
 */
export declare const generateModel: <T extends object, M extends object>(kind: string, schema: Schema<T, M>, gstore: Gstore) => Model<T, M>;
interface GetOptions {
    /**
     * If you have provided an Array of ids, the order returned by the Datastore is not guaranteed.
     * If you need the entities back in the same order of the IDs provided, then set `preserveOrder: true`
     *
     * @type {boolean}
     * @default false
     */
    preserveOrder?: boolean;
    /**
     * An optional Dataloader instance. Read more about Dataloader in the docs.
     *
     * @link https://sebloix.gitbook.io/gstore-node/cache-dataloader/dataloader
     */
    dataloader?: any;
    /**
     * Only if the cache has been turned "on" when initializing gstore.
     * Fetch the entity from the cache first. If you want to bypass the cache
     * and fetch the entiy from the Datastore, set `cache: false`.
     *
     * @type {boolean}
     * @default The "global" cache configuration
     * @link https://sebloix.gitbook.io/gstore-node/cache-dataloader/cache
     */
    cache?: boolean;
    /**
     * Only if the cache has been turned "on" when initializing gstore.
     * After the entty has been fetched from the Datastore it will be added to the cache.
     * You can specify here a custom ttl (Time To Live) for the cache of the entity.
     *
     * @type {(number | { [propName: string] : number })}
     * @default The "ttl.keys" cache configuration
     * @link https://sebloix.gitbook.io/gstore-node/cache-dataloader/cache
     */
    ttl?: number | {
        [propName: string]: number;
    };
}
interface DeleteOptions {
    dataloader?: any;
    cache?: any;
    clearQueries?: boolean;
}
interface DeleteResponse {
    key?: EntityKey | EntityKey[];
    success?: boolean;
    apiResponse?: any;
    indexUpdates?: number;
}
interface DeleteAllResponse {
    success: boolean;
    message: string;
}
interface PopulateOptions extends GetOptions {
    transaction?: Transaction;
}
export default Model;
