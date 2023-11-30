import { Transaction } from '@google-cloud/datastore';
import DataLoader from 'dataloader';
import Gstore from './index';
import Schema from './schema';
import Model from './model';
import { EntityKey, EntityData, IdType, Ancestor, GenericObject, DatastoreSaveMethod, PromiseWithPopulate, CustomEntityFunction } from './types';
import { ValidateResponse } from './helpers/validation';
export declare class GstoreEntity<T extends object = GenericObject> {
    entityKey: EntityKey;
    entityData: {
        [P in keyof T]: T[P];
    };
    /**
     * If you provided a dataloader instance when saving the entity, it will
     * be added as property. You will then have access to it in your "pre" save() hooks.
     */
    dataloader: DataLoader<EntityKey[], EntityData> | undefined;
    context: GenericObject;
    private __gstore;
    private __schema;
    private __entityKind;
    __hooksEnabled: boolean;
    constructor(data?: EntityData<T>, id?: IdType, ancestors?: Ancestor, namespace?: string, key?: EntityKey);
    /**
     * Save the entity in the Datastore
     *
     * @param {Transaction} transaction The optional transaction to save the entity into
     * @param options Additional configuration
     * @returns {Promise<GstoreEntity<T>>}
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/save
     */
    save(transaction?: Transaction, opts?: SaveOptions): Promise<Entity<T>>;
    /**
     * Validate the entity data. It returns an object with an `error` and a `value` property.
     * If the error is `null`, the validation has passed.
     * The `value` returned is the entityData sanitized (unknown properties removed).
     *
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/validate
     */
    validate(): ValidateResponse;
    /**
     * Returns a JSON object of the entity data along with the entity id/name.
     * The properties on the Schema where "read" has been set to "false" won't be added
     * unless `readAll: true` is passed in the options.
     *
     * @param options Additional configuration
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/plain
     */
    plain(options?: PlainOptions | undefined): Partial<EntityData<T>> & {
        [key: string]: any;
    };
    get<P extends keyof T>(path: P): any;
    set<P extends keyof T>(path: P, value: any): Entity<T>;
    /**
     * Access any gstore Model from the entity instance.
     *
     * @param {string} entityKind The entity kind
     * @returns {Model} The Model
     * @example
    ```
    const user = new User({ name: 'john', pictId: 123});
    const ImageModel = user.model('Image');
    ImageModel.get(user.pictId).then(...);
    ```
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/model
     */
    model(name: string): Model;
    /**
     * Fetch entity from Datastore
     *
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/datastoreentity
     */
    datastoreEntity(options?: {}): Promise<Entity<T> | null>;
    /**
     * Populate entity references (whose properties are an entity Key) and merge them in the entity data.
     *
     * @param refs The entity references to fetch from the Datastore. Can be one (string) or multiple (array of string)
     * @param properties The properties to return from the reference entities. If not specified, all properties will be returned
     * @link https://sebloix.gitbook.io/gstore-node/entity/methods/populate
     */
    populate<U extends string | string[]>(path?: U, propsToSelect?: U extends Array<string> ? never : string | string[]): PromiseWithPopulate<Entity<T>>;
    /**
     * Process some basic formatting to the entity data before save
     * - automatically set the modifiedOn property to current date (if the property exists on schema)
     * - convert object with latitude/longitude to Datastore GeoPoint
     * - convert string date to Date object
     */
    serializeEntityData(): void;
    get id(): string | number;
    /**
     * The gstore instance
     */
    get gstore(): Gstore;
    /**
     * The entity Model Schema
     */
    get schema(): Schema<T>;
    /**
     * The Datastore entity kind
     */
    get entityKind(): string;
    private __buildEntityData;
    private __createKey;
    private __addAliasAndVirtualProperties;
    private __registerHooksFromSchema;
    private __addCustomMethodsFromSchema;
    private __getEntityDataWithVirtuals;
}
export default GstoreEntity;
export declare type Entity<T extends object = GenericObject, M extends object = {
    [key: string]: CustomEntityFunction<T>;
}> = GstoreEntity<T> & T & M;
interface SaveOptions {
    method?: DatastoreSaveMethod;
    sanitizeEntityData?: boolean;
    cache?: any;
}
interface PlainOptions {
    /**
     * Output all the entity data properties, regardless of the Schema `read` setting.
     *
     * @type {boolean}
     * @default false
     */
    readAll?: boolean;
    /**
     * Add the _virtual_ properties defined for the entity on the Schema.
     *
     * @type {boolean}
     * @default false
     * @link https://sebloix.gitbook.io/gstore-node/schema/methods/virtual
     */
    virtuals?: boolean;
    /**
     * Add the full entity _Key_ object at the a "__key" property
     *
     * @type {boolean}
     * @default false
     */
    showKey?: boolean;
}
