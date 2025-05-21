/// <reference types="node" />
import VirtualType from './virtualType';
import { FunctionType, FuncReturningPromise, CustomEntityFunction, GenericObject, EntityFormatType, JSONFormatType } from './types';
import { QueryListOptions } from './query';
/**
 * gstore Schema
 */
declare class Schema<T extends object = any, M extends object = {
    [key: string]: CustomEntityFunction<T>;
}> {
    readonly methods: {
        [P in keyof M]: CustomEntityFunction<T>;
    };
    readonly paths: {
        [P in keyof T]: SchemaPathDefinition;
    };
    readonly options: SchemaOptions;
    readonly __virtuals: {
        [key: string]: VirtualType;
    };
    readonly shortcutQueries: {
        [key: string]: QueryListOptions<T>;
    };
    joiSchema?: GenericObject;
    __callQueue: {
        model: {
            [key: string]: {
                pres: (FuncReturningPromise | FuncReturningPromise[])[];
                post: (FuncReturningPromise | FuncReturningPromise[])[];
            };
        };
        entity: {
            [key: string]: {
                pres: (FuncReturningPromise | FuncReturningPromise[])[];
                post: (FuncReturningPromise | FuncReturningPromise[])[];
            };
        };
    };
    __meta: GenericObject;
    excludedFromIndexes: {
        [P in keyof T]?: string[];
    };
    constructor(properties: {
        [P in keyof T]: SchemaPathDefinition;
    }, options?: SchemaOptions);
    /**
     * Add custom methods to entities.
     * @link https://sebloix.gitbook.io/gstore-node/schema/custom-methods
     *
     * @example
     * ```
     * schema.methods.profilePict = function() {
         return this.model('Image').get(this.imgIdx)
     * }
     * ```
    */
    method(name: string | {
        [key: string]: FunctionType;
    }, fn?: FunctionType): void;
    queries(type: 'list', settings: QueryListOptions<T>): void;
    /**
     * Getter / Setter for Schema paths.
     *
     * @param {string} propName The entity property
     * @param {SchemaPathDefinition} [definition] The property definition
     * @link https://sebloix.gitbook.io/gstore-node/schema/methods/path
     */
    path(propName: string, definition?: SchemaPathDefinition): Schema<T> | SchemaPathDefinition | undefined;
    /**
     * Register a middleware to be executed before "save()", "delete()", "findOne()" or any of your custom method.
     * The callback will receive the original argument(s) passed to the target method. You can modify them
     * in your resolve passing an object with an __override property containing the new parameter(s)
     * for the target method.
     *
     * @param {string} method The target method to add the hook to
     * @param {(...args: any[]) => Promise<any>} fn Function to execute before the target method.
     * It must return a Promise
     * @link https://sebloix.gitbook.io/gstore-node/middleware-hooks/pre-hooks
     */
    pre(method: string, fn: FuncReturningPromise | FuncReturningPromise[]): number;
    /**
     * Register a "post" middelware to execute after a target method.
     *
     * @param {string} method The target method to add the hook to
     * @param {(response: any) => Promise<any>} callback Function to execute after the target method.
     * It must return a Promise
     * @link https://sebloix.gitbook.io/gstore-node/middleware-hooks/post-hooks
     */
    post(method: string, fn: FuncReturningPromise | FuncReturningPromise[]): number;
    /**
     * Getter / Setter of a virtual property.
     * Virtual properties are created dynamically and not saved in the Datastore.
     *
     * @param {string} propName The virtual property name
     * @link https://sebloix.gitbook.io/gstore-node/schema/methods/virtual
     */
    virtual(propName: string): VirtualType;
    /**
     * Executes joi.validate on given data. If the schema does not have a joi config object data is returned.
     *
     * @param {*} data The data to sanitize
     * @returns {*} The data sanitized
     */
    validateJoi(entityData: any): any;
    updateExcludedFromIndexesMap(property: keyof T, definition: SchemaPathDefinition): void;
    /**
     * Flag that returns "true" if the schema has a joi config object.
     */
    get isJoi(): boolean;
    private parseSchemaProperties;
    static initSchemaOptions(provided?: SchemaOptions): SchemaOptions;
    /**
     * Custom Schema Types
     */
    static Types: {
        Double: 'double';
        GeoPoint: 'geoPoint';
        Key: 'entityKey';
    };
}
export interface SchemaPathDefinition {
    type?: PropType;
    validate?: Validator;
    optional?: boolean;
    default?: any;
    excludeFromIndexes?: boolean | string | string[];
    read?: boolean;
    excludeFromRead?: string[];
    write?: boolean;
    required?: boolean;
    values?: any[];
    joi?: any;
    ref?: string;
}
export type JoiConfig = {
    extra?: GenericObject;
    options?: GenericObject;
};
export interface SchemaOptions {
    validateBeforeSave?: boolean;
    explicitOnly?: boolean;
    excludeLargeProperties?: boolean;
    queries?: {
        readAll?: boolean;
        format?: JSONFormatType | EntityFormatType;
        showKey?: string;
    };
    joi?: boolean | JoiConfig;
}
export type Validator = string | {
    rule: string | ((...args: any[]) => boolean);
    args?: any[];
};
export type PropType = NumberConstructor | StringConstructor | ObjectConstructor | ArrayConstructor | BooleanConstructor | DateConstructor | typeof Buffer | 'double' | 'geoPoint' | 'entityKey';
export default Schema;
