import { FunctionType, GenericObject } from './types';
declare class VirtualType {
    readonly name: string;
    getter: FunctionType | null;
    setter: FunctionType | null;
    options: GenericObject;
    constructor(name: string, options?: GenericObject);
    get(fn: FunctionType): VirtualType;
    set(fn: FunctionType): VirtualType;
    applyGetters(scope: any): unknown;
    applySetters(value: unknown, scope: any): unknown;
}
export default VirtualType;
