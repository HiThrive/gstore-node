import { Transaction, Query as DatastoreQuery } from '@google-cloud/datastore';
import Model from './model';
import { Entity } from './entity';
import { EntityData, EntityFormatType, JSONFormatType, PromiseWithPopulate, DatastoreOperator, OrderOptions } from './types';
declare class Query<T extends object, M extends object> {
    Model: Model<T, M>;
    constructor(model: Model<T, M>);
    initQuery<R = QueryResponse<T>>(namespace?: string, transaction?: Transaction): GstoreQuery<T, R>;
    list<U extends QueryListOptions<T>, Outputformat = U['format'] extends EntityFormatType ? Entity<T, M> : EntityData<T>>(options?: U): PromiseWithPopulate<QueryResponse<T, Outputformat[]>>;
    findOne(keyValues: {
        [P in keyof Partial<T>]: T[P];
    }, ancestors?: Array<string | number>, namespace?: string, options?: {
        readAll?: boolean;
        cache?: boolean;
        ttl?: number | {
            [key: string]: number;
        };
    }, transaction?: Transaction): PromiseWithPopulate<Entity<T, M> | null>;
    /**
     * Find entities before or after an entity based on a property and a value.
     *
     * @static
     * @param {string} propName The property to look around
     * @param {*} value The property value
     * @param options Additional configuration
     * @returns {Promise<any>}
     * @example
     ```
     // Find the next 20 post after March 1st 2018
     BlogPost.findAround('publishedOn', '2018-03-01', { after: 20 })
     ```
     * @link https://sebloix.gitbook.io/gstore-node/queries/findaround
     */
    findAround<U extends QueryFindAroundOptions, Outputformat = U['format'] extends EntityFormatType ? Entity<T, M> : EntityData<T>>(property: keyof T, value: any, options: U, namespace?: string): PromiseWithPopulate<Outputformat[]>;
}
export interface GstoreQuery<T, R> extends Omit<DatastoreQuery, 'run' | 'filter' | 'order'> {
    __originalRun: DatastoreQuery['run'];
    run: QueryRunFunc<T, R>;
    filter<P extends keyof T>(property: P, value: T[P]): this;
    filter<P extends keyof T>(property: P, operator: DatastoreOperator, value: T[P]): this;
    order(property: keyof T, options?: OrderOptions): this;
}
declare type QueryRunFunc<T, R> = (options?: QueryOptions, responseHandler?: (res: QueryResponse<T>) => R) => PromiseWithPopulate<R>;
export interface QueryOptions {
    /**
     * Specify either strong or eventual. If not specified, default values are chosen by Datastore for the operation.
     * Learn more about strong and eventual consistency in the link below
     *
     * @type {('strong' | 'eventual')}
     * @link https://cloud.google.com/datastore/docs/articles/balancing-strong-and-eventual-consistency-with-google-cloud-datastore
     */
    consistency?: 'strong' | 'eventual';
    /**
     * If set to true will return all the properties of the entity,
     * regardless of the *read* parameter defined in the Schema
     *
     * @type {boolean}
     * @default false
     */
    readAll?: boolean;
    /**
     * Response format for the entities. Either plain object or entity instances
     *
     * @type {'JSON' | 'ENTITY'}
     * @default 'JSON'
     */
    format?: JSONFormatType | EntityFormatType;
    /**
     * Add a "__key" property to the entity data with the complete Key from the Datastore.
     *
     * @type {boolean}
     * @default false
     */
    showKey?: boolean;
    /**
     * If set to true, it will read from the cache and prime the cache with the response of the query.
     *
     * @type {boolean}
     * @default The "global" cache configuration.
     */
    cache?: boolean;
    /**
     * Custom TTL value for the cache. For multi-store it can be an object of ttl values
     *
     * @type {(number | { [propName: string]: number })}
     * @default The cache.ttl.queries value
     */
    ttl?: number | {
        [propName: string]: number;
    };
}
export interface QueryListOptions<T> extends QueryOptions {
    /**
     * Optional namespace for the query.
     */
    namespace?: string;
    /**
     * The total number of entities to return from the query.
     */
    limit?: number;
    /**
     * Descending is optional and default to "false"
     *
     * @example ```{ property: 'userName', descending: true }```
     */
    order?: {
        property: keyof T;
        descending?: boolean;
    } | {
        property: keyof T;
        descending?: boolean;
    }[];
    /**
     * Retrieve only select properties from the matched entities.
     */
    select?: string | string[];
    /**
     * Supported comparison operators are =, <, >, <=, and >=.
     * "Not equal" and IN operators are currently not supported.
     */
    filters?: [string, any] | [string, DatastoreOperator, any] | any[][];
    /**
     * Filter a query by ancestors.
     */
    ancestors?: Array<string | number>;
    /**
     * Set a starting cursor to a query.
     */
    start?: string;
    /**
     * Set an offset on a query.
     */
    offset?: number;
}
export interface QueryFindAroundOptions extends QueryOptions {
    before?: number;
    after?: number;
    readAll?: boolean;
    format?: JSONFormatType | EntityFormatType;
    showKey?: boolean;
}
export interface QueryResponse<T, F = EntityData<T>[]> {
    entities: F;
    nextPageCursor?: string;
}
export default Query;
