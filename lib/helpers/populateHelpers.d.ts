import Schema from '../schema';
import { PopulateRef } from '../types';
export type PopulateHandler = <U extends string | string[]>(path?: U, propsToSelect?: U extends Array<string> ? never : string | string[]) => Promise<any>;
declare const _default: {
    addPathToPopulateRefs: (initialPath: string, _select: string | string[] | undefined, refs: PopulateRef[][]) => void;
    populateFactory: <T extends object>(refsToPopulate: PopulateRef[][], promise: Promise<any>, schema: Schema<T, {
        [key: string]: import("../types").CustomEntityFunction<T>;
    }>) => PopulateHandler;
};
export default _default;
