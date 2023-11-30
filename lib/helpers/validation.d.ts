import { Datastore } from '@google-cloud/datastore';
import { ValidationError } from '../errors';
import { EntityData } from '../types';
import Schema from '../schema';
export interface ValidateResponse {
    error: ValidationError | null;
    value: EntityData;
    then: (onSuccess: (entityData: EntityData) => any, onError: (error: ValidationError) => any) => Promise<any>;
    catch: (onError: (error: ValidationError) => any) => Promise<any> | undefined;
}
declare const _default: {
    validate: <T extends object>(entityData: EntityData<{
        [key: string]: any;
    }>, schema: Schema<T, {
        [key: string]: import("../types").CustomEntityFunction<T>;
    }>, entityKind: string, datastore: Datastore) => ValidateResponse;
};
export default _default;
