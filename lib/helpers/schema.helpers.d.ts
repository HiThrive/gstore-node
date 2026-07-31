import Schema from '../schema';
import { GenericObject } from '../types';
declare const _default: {
    extractMetaFromSchema: <T extends object>(paths: Schema<T>["paths"]) => GenericObject;
};
export default _default;
