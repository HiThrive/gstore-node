import { GenericObject } from '../types';
declare const _default: {
    extractMetaFromSchema: <T extends object>(paths: { [P in keyof T]: import("../schema").SchemaPathDefinition; }) => GenericObject;
};
export default _default;
