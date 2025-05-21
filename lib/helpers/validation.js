"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isValid_1 = __importDefault(require("date-fns/isValid"));
const validator_1 = __importDefault(require("validator"));
const is_1 = __importDefault(require("is"));
const errors_1 = require("../errors");
const isValidDate = (value) => {
    if (value instanceof Date) {
        return true;
    }
    if (typeof value !== 'string') {
        return false;
    }
    return (0, isValid_1.default)(new Date(value));
};
const isInt = (n) => Number(n) === n && n % 1 === 0;
const isFloat = (n) => Number(n) === n && n % 1 !== 0;
const isValueEmpty = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim().length === 0);
const isValidLngLat = (data) => {
    const validLatitude = (isInt(data.latitude) || isFloat(data.latitude)) && data.latitude >= -90 && data.latitude <= 90;
    const validLongitude = (isInt(data.longitude) || isFloat(data.longitude)) && data.longitude >= -180 && data.longitude <= 180;
    return validLatitude && validLongitude;
};
const errorToObject = (error) => ({
    code: error.code,
    message: error.message,
    ref: error.ref,
});
const validatePropType = (value, propType, prop, pathConfig, datastore) => {
    let isValid;
    let ref;
    let type = propType;
    if (typeof propType === 'function') {
        type = propType.name.toLowerCase();
    }
    switch (type) {
        case 'entityKey':
            isValid = datastore.isKey(value);
            ref = 'key.base';
            if (isValid && pathConfig.ref) {
                // Make sure the Entity Kind is also valid (if any)
                const entityKind = value.path[value.path.length - 2];
                isValid = entityKind === pathConfig.ref;
                ref = 'key.entityKind';
            }
            break;
        case 'string':
            isValid = typeof value === 'string';
            ref = 'string.base';
            break;
        case 'date':
            isValid = isValidDate(value);
            ref = 'datetime.base';
            break;
        case 'array':
            isValid = is_1.default.array(value);
            ref = 'array.base';
            break;
        case 'number': {
            const isIntInstance = value.constructor.name === 'Int';
            if (isIntInstance) {
                isValid = !isNaN(parseInt(value.value, 10));
            }
            else {
                isValid = isInt(value);
            }
            ref = 'int.base';
            break;
        }
        case 'double': {
            const isIntInstance = value.constructor.name === 'Double';
            if (isIntInstance) {
                isValid = isFloat(parseFloat(value.value)) || isInt(parseFloat(value.value));
            }
            else {
                isValid = isFloat(value) || isInt(value);
            }
            ref = 'double.base';
            break;
        }
        case 'buffer':
            isValid = value instanceof Buffer;
            ref = 'buffer.base';
            break;
        case 'geoPoint': {
            if (is_1.default.object(value) &&
                Object.keys(value).length === 2 &&
                {}.hasOwnProperty.call(value, 'longitude') &&
                {}.hasOwnProperty.call(value, 'latitude')) {
                isValid = isValidLngLat(value);
            }
            else {
                isValid = value.constructor.name === 'GeoPoint';
            }
            ref = 'geopoint.base';
            break;
        }
        default:
            if (Array.isArray(value)) {
                isValid = false;
            }
            else {
                isValid = typeof value === type;
            }
            ref = 'prop.type';
    }
    if (!isValid) {
        return new errors_1.TypeError(errors_1.ERROR_CODES.ERR_PROP_TYPE, undefined, { ref, messageParams: [prop, type], property: prop });
    }
    return null;
};
const validatePropValue = (prop, value, validationRule) => {
    let validationArgs = [];
    let validationFn;
    /**
     * If the validate property is an object, then it's assumed that
     * it contains the 'rule' property, which will be the new
     * validationRule's value.
     * If the 'args' prop was passed then we concat them to 'validationArgs'.
     */
    if (typeof validationRule === 'object') {
        const { rule } = validationRule;
        validationArgs = validationRule.args || [];
        if (typeof rule === 'function') {
            validationFn = rule;
            validationArgs = [value, validator_1.default, ...validationArgs];
        }
        else {
            validationRule = rule;
        }
    }
    if (!validationFn) {
        /**
         * Validator.js only works with string values
         * let's make sure we are working with a string.
         */
        const isObject = typeof value === 'object';
        const strValue = typeof value !== 'string' && !isObject ? String(value) : value;
        validationArgs = [strValue, ...validationArgs];
        validationFn = validator_1.default[validationRule];
    }
    if (!validationFn.apply(validator_1.default, validationArgs)) {
        return new errors_1.ValueError(errors_1.ERROR_CODES.ERR_PROP_VALUE, undefined, {
            type: 'prop.validator',
            messageParams: [value, prop],
            property: prop,
        });
    }
    return null;
};
const validate = (entityData, schema, entityKind, datastore) => {
    const errors = [];
    let prop;
    let skip;
    let schemaHasProperty;
    let pathConfig;
    let propertyType;
    let propertyValue;
    let isEmpty;
    let isRequired;
    let error;
    const props = Object.keys(entityData);
    const totalProps = Object.keys(entityData).length;
    if (schema.isJoi) {
        // We leave the validation to Joi
        return schema.validateJoi(entityData);
    }
    for (let i = 0; i < totalProps; i += 1) {
        prop = props[i];
        skip = false;
        error = null;
        schemaHasProperty = {}.hasOwnProperty.call(schema.paths, prop);
        pathConfig = schema.paths[prop] || {};
        propertyType = schemaHasProperty ? pathConfig.type : null;
        propertyValue = entityData[prop];
        isEmpty = isValueEmpty(propertyValue);
        if (typeof propertyValue === 'string') {
            propertyValue = propertyValue.trim();
        }
        if ({}.hasOwnProperty.call(schema.__virtuals, prop)) {
            // Virtual, remove it and skip the rest
            delete entityData[prop];
            skip = true;
        }
        else if (!schemaHasProperty && schema.options.explicitOnly === false) {
            // No more validation, key does not exist but it is allowed
            skip = true;
        }
        if (!skip) {
            // ... is allowed?
            if (!schemaHasProperty) {
                error = new errors_1.ValidationError(errors_1.ERROR_CODES.ERR_PROP_NOT_ALLOWED, undefined, {
                    type: 'prop.not.allowed',
                    messageParams: [prop, entityKind],
                    property: prop,
                });
                errors.push(errorToObject(error));
            }
            // ...is required?
            isRequired = schemaHasProperty && {}.hasOwnProperty.call(pathConfig, 'required') && pathConfig.required === true;
            if (isRequired && isEmpty) {
                error = new errors_1.ValueError(errors_1.ERROR_CODES.ERR_PROP_REQUIRED, undefined, {
                    type: 'prop.required',
                    messageParams: [prop],
                    property: prop,
                });
                errors.push(errorToObject(error));
            }
            // ... is valid prop Type?
            if (schemaHasProperty && !isEmpty && {}.hasOwnProperty.call(pathConfig, 'type')) {
                error = validatePropType(propertyValue, propertyType, prop, pathConfig, datastore);
                if (error) {
                    errors.push(errorToObject(error));
                }
            }
            // ... is valid prop Value?
            if (error === null && schemaHasProperty && !isEmpty && {}.hasOwnProperty.call(pathConfig, 'validate')) {
                error = validatePropValue(prop, propertyValue, pathConfig.validate);
                if (error) {
                    errors.push(errorToObject(error));
                }
            }
            // ... is value in range?
            if (schemaHasProperty &&
                !isEmpty &&
                {}.hasOwnProperty.call(pathConfig, 'values') &&
                !pathConfig.values.includes(propertyValue)) {
                error = new errors_1.ValueError(errors_1.ERROR_CODES.ERR_PROP_IN_RANGE, undefined, {
                    type: 'value.range',
                    messageParams: [prop, pathConfig.values],
                    property: prop,
                });
                errors.push(errorToObject(error));
            }
        }
    }
    let validationError = null;
    if (Object.keys(errors).length > 0) {
        validationError = new errors_1.ValidationError(errors_1.ERROR_CODES.ERR_VALIDATION, undefined, {
            errors,
            messageParams: [entityKind],
        });
    }
    const validateResponse = {
        error: validationError,
        value: entityData,
        then: (onSuccess, onError) => {
            if (validationError) {
                return Promise.resolve(onError(validationError));
            }
            return Promise.resolve(onSuccess(entityData));
        },
        catch: (onError) => {
            if (validationError) {
                return Promise.resolve(onError(validationError));
            }
            return undefined;
        },
    };
    return validateResponse;
};
exports.default = {
    validate,
};
