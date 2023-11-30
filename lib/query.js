"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extend_1 = __importDefault(require("extend"));
const is_1 = __importDefault(require("is"));
const helpers_1 = __importDefault(require("./helpers"));
const errors_1 = require("./errors");
const serializers_1 = require("./serializers");
const { queryHelpers, populateHelpers } = helpers_1.default;
const { populateFactory } = populateHelpers;
const { createDatastoreQueryForModel, buildQueryFromOptions } = queryHelpers;
class Query {
    constructor(model) {
        this.Model = model;
    }
    initQuery(namespace, transaction) {
        const query = createDatastoreQueryForModel(this.Model, namespace, transaction);
        const enhancedQueryRun = (options, responseHandler = (res) => res) => {
            options = extend_1.default(true, {}, this.Model.schema.options.queries, options);
            /**
             * Array to keep all the references entities to fetch
             */
            const refsToPopulate = [];
            let promise;
            const onResponse = (data) => {
                let entities = data[0];
                const info = data[1];
                // Convert to JSON or ENTITY acording to which format is passed. (default = JSON)
                // If JSON => Add id property to entities and suppress properties with "read" config is set to `false`
                entities = entities.map((entity) => serializers_1.datastoreSerializer.fromDatastore(entity, this.Model, options));
                const response = {
                    entities,
                };
                if (info.moreResults !== this.Model.gstore.ds.NO_MORE_RESULTS) {
                    response.nextPageCursor = info.endCursor;
                }
                return response;
            };
            // prettier-ignore
            const populateHandler = (response) => refsToPopulate.length
                ? this.Model.__populate(refsToPopulate, options)(response.entities).then((entitiesPopulated) => (Object.assign(Object.assign({}, response), { entities: entitiesPopulated })))
                : response;
            if (this.Model.__hasCache(options, 'queries')) {
                promise = this.Model.gstore
                    .cache.queries.read(query, options, query.__originalRun.bind(query))
                    .then(onResponse)
                    .then(populateHandler)
                    .then(responseHandler);
            }
            else {
                promise = query.__originalRun
                    .call(query, options)
                    .then(onResponse)
                    .then(populateHandler)
                    .then(responseHandler);
            }
            promise.populate = populateFactory(refsToPopulate, promise, this.Model.schema);
            return promise;
        };
        /* eslint-disable @typescript-eslint/unbound-method */
        // ((query as unknown) as GstoreQuery<T, QueryResponse<T>>).__originalRun = ((query as unknown) as DatastoreQuery).run;
        query.__originalRun = query.run;
        query.run = enhancedQueryRun;
        /* eslint-enable @typescript-eslint/unbound-method */
        return query;
    }
    list(options = {}) {
        // If global options set in schema, we extend it with passed options
        if ({}.hasOwnProperty.call(this.Model.schema.shortcutQueries, 'list')) {
            options = extend_1.default({}, this.Model.schema.shortcutQueries.list, options);
        }
        let query = this.initQuery(options && options.namespace);
        // Build Datastore Query from options passed
        query = buildQueryFromOptions(query, options, this.Model.gstore.ds);
        const { limit, offset, order, select, ancestors, filters, start } = options, rest = __rest(options, ["limit", "offset", "order", "select", "ancestors", "filters", "start"]);
        return query.run(rest);
    }
    findOne(keyValues, ancestors, namespace, options, transaction) {
        this.Model.__hooksEnabled = true;
        if (!is_1.default.object(keyValues)) {
            return Promise.reject(new Error('[gstore.findOne()]: "Params" has to be an object.'));
        }
        const query = this.initQuery(namespace, transaction);
        query.limit(1);
        Object.keys(keyValues).forEach((k) => {
            query.filter(k, keyValues[k]);
        });
        if (ancestors) {
            query.hasAncestor(this.Model.gstore.ds.key(ancestors.slice()));
        }
        const responseHandler = ({ entities }) => {
            if (entities.length === 0) {
                if (this.Model.gstore.config.errorOnEntityNotFound) {
                    throw new errors_1.GstoreError(errors_1.ERROR_CODES.ERR_ENTITY_NOT_FOUND, `${this.Model.entityKind} not found`);
                }
                return null;
            }
            const [e] = entities;
            const entity = new this.Model(e, undefined, undefined, undefined, e[this.Model.gstore.ds.KEY]);
            return entity;
        };
        return query.run(options, responseHandler);
    }
    /**
     * Find entities before or after an entity based on a property and a value.
     *
     * @static
     * @param {string} propName The property to look around
     * @param {*} value The property value
     * @param options Additional configuration
     * @returns {Promise<any>}
     * @example
     ```
     // Find the next 20 post after March 1st 2018
     BlogPost.findAround('publishedOn', '2018-03-01', { after: 20 })
     ```
     * @link https://sebloix.gitbook.io/gstore-node/queries/findaround
     */
    findAround(property, value, options, namespace) {
        const validateArguments = () => {
            if (!property || !value || !options) {
                return { error: new Error('[gstore.findAround()]: Not all the arguments were provided.') };
            }
            if (!is_1.default.object(options)) {
                return { error: new Error('[gstore.findAround()]: Options pased has to be an object.') };
            }
            if (!{}.hasOwnProperty.call(options, 'after') && !{}.hasOwnProperty.call(options, 'before')) {
                return { error: new Error('[gstore.findAround()]: You must set "after" or "before" in options.') };
            }
            if ({}.hasOwnProperty.call(options, 'after') && {}.hasOwnProperty.call(options, 'before')) {
                return { error: new Error('[gstore.findAround()]: You can\'t set both "after" and "before".') };
            }
            return { error: null };
        };
        const { error } = validateArguments();
        if (error) {
            return Promise.reject(error);
        }
        const query = this.initQuery(namespace);
        const op = options.after ? '>' : '<';
        const descending = !!options.after;
        query.filter(property, op, value);
        query.order(property, { descending });
        query.limit(options.after ? options.after : options.before);
        const { after, before } = options, rest = __rest(options, ["after", "before"]);
        return query.run(rest, (res) => res.entities);
    }
}
exports.default = Query;
