"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_1 = __importDefault(require("is"));
const arrify_1 = __importDefault(require("arrify"));
const buildQueryFromOptions = (query, options, ds) => {
    if (!query || query.constructor.name !== 'Query') {
        throw new Error('Query not passed');
    }
    if (!options || typeof options !== 'object') {
        return query;
    }
    if (options.limit) {
        query.limit(options.limit);
    }
    if (options.offset) {
        query.offset(options.offset);
    }
    if (options.order) {
        const orderArray = arrify_1.default(options.order);
        orderArray.forEach((order) => {
            query.order(order.property, {
                descending: {}.hasOwnProperty.call(order, 'descending') ? order.descending : false,
            });
        });
    }
    if (options.select) {
        query.select(options.select);
    }
    if (options.ancestors) {
        if (!ds || ds.constructor.name !== 'Datastore') {
            throw new Error('Datastore instance not passed');
        }
        const ancestorKey = options.namespace
            ? ds.key({ namespace: options.namespace, path: options.ancestors.slice() })
            : ds.key(options.ancestors.slice());
        query.hasAncestor(ancestorKey);
    }
    if (options.filters) {
        if (!is_1.default.array(options.filters)) {
            throw new Error('Wrong format for filters option');
        }
        if (!is_1.default.array(options.filters[0])) {
            options.filters = [options.filters];
        }
        if (options.filters[0].length > 1) {
            options.filters.forEach((filter) => {
                // We check if the value is a function
                // if it is, we execute it.
                let value = filter[filter.length - 1];
                value = is_1.default.fn(value) ? value() : value;
                const f = filter.slice(0, -1).concat([value]);
                query.filter(...f);
            });
        }
    }
    if (options.start) {
        query.start(options.start);
    }
    return query;
};
const createDatastoreQueryForModel = (model, namespace, transaction) => {
    if (transaction && transaction.constructor.name !== 'Transaction') {
        throw Error('Transaction needs to be a gcloud Transaction');
    }
    const createQueryArgs = [model.entityKind];
    if (namespace) {
        createQueryArgs.unshift(namespace);
    }
    if (transaction) {
        return transaction.createQuery(...createQueryArgs);
    }
    return model.gstore.ds.createQuery(...createQueryArgs);
};
exports.default = {
    buildQueryFromOptions,
    createDatastoreQueryForModel,
};
