export declare const ERROR_CODES: {
    ERR_ENTITY_NOT_FOUND: string;
    ERR_GENERIC: string;
    ERR_VALIDATION: string;
    ERR_PROP_TYPE: string;
    ERR_PROP_VALUE: string;
    ERR_PROP_NOT_ALLOWED: string;
    ERR_PROP_REQUIRED: string;
    ERR_PROP_IN_RANGE: string;
};
export declare const message: (text: string, ...args: any[]) => string;
export declare class GstoreError extends Error {
    code: string;
    constructor(code?: string, msg?: string, args?: any);
}
export declare class ValidationError extends GstoreError {
    constructor(code: string, msg?: string, args?: any);
}
export declare class TypeError extends GstoreError {
    constructor(code: string, msg?: string, args?: any);
}
export declare class ValueError extends GstoreError {
    constructor(code: string, msg?: string, args?: any);
}
