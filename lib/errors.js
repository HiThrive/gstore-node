"use strict";
/* eslint-disable max-classes-per-file, no-use-before-define */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const is_1 = __importDefault(require("is"));
exports.ERROR_CODES = {
    ERR_ENTITY_NOT_FOUND: 'ERR_ENTITY_NOT_FOUND',
    ERR_GENERIC: 'ERR_GENERIC',
    ERR_VALIDATION: 'ERR_VALIDATION',
    ERR_PROP_TYPE: 'ERR_PROP_TYPE',
    ERR_PROP_VALUE: 'ERR_PROP_VALUE',
    ERR_PROP_NOT_ALLOWED: 'ERR_PROP_NOT_ALLOWED',
    ERR_PROP_REQUIRED: 'ERR_PROP_REQUIRED',
    ERR_PROP_IN_RANGE: 'ERR_PROP_IN_RANGE',
};
exports.message = (text, ...args) => util_1.default.format(text, ...args);
const messages = {
    ERR_GENERIC: 'An error occured',
    ERR_VALIDATION: (entityKind) => exports.message('The entity data does not validate against the "%s" Schema', entityKind),
    ERR_PROP_TYPE: (prop, type) => exports.message('Property "%s" must be a %s', prop, type),
    ERR_PROP_VALUE: (value, prop) => exports.message('"%s" is not a valid value for property "%s"', value, prop),
    ERR_PROP_NOT_ALLOWED: (prop, entityKind) => exports.message('Property "%s" is not allowed for entityKind "%s"', prop, entityKind),
    ERR_PROP_REQUIRED: (prop) => exports.message('Property "%s" is required but no value has been provided', prop),
    ERR_PROP_IN_RANGE: (prop, range) => exports.message('Property "%s" must be one of [%s]', prop, range && range.join(', ')),
};
class GstoreError extends Error {
    constructor(code, msg, args) {
        if (!msg && code && code in messages) {
            if (is_1.default.function(messages[code])) {
                msg = messages[code](...args.messageParams);
            }
            else {
                msg = messages[code];
            }
        }
        if (!msg) {
            msg = messages.ERR_GENERIC;
        }
        super(msg);
        this.name = 'GstoreError';
        this.message = msg;
        this.code = code || exports.ERROR_CODES.ERR_GENERIC;
        if (args) {
            Object.keys(args).forEach((k) => {
                if (k !== 'messageParams') {
                    this[k] = args[k];
                }
            });
        }
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.GstoreError = GstoreError;
class ValidationError extends GstoreError {
    constructor(code, msg, args) {
        super(code, msg, args);
        this.name = 'ValidationError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValidationError = ValidationError;
class TypeError extends GstoreError {
    constructor(code, msg, args) {
        super(code, msg, args);
        this.name = 'TypeError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.TypeError = TypeError;
class ValueError extends GstoreError {
    constructor(code, msg, args) {
        super(code, msg, args);
        this.name = 'ValueError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValueError = ValueError;
