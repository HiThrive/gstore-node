"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const datastore_1 = require("@google-cloud/datastore");
class Datastore {
    constructor(options) {
        this.googleDatastore = new datastore_1.Datastore(options);
    }
    key(options) {
        return this.googleDatastore.key(options);
    }
    isKey(key) {
        return this.googleDatastore.isKey(key);
    }
    save() {
        return Promise.resolve(this);
    }
    get() {
        return Promise.resolve(this);
    }
    delete() {
        return Promise.resolve(this);
    }
    createQuery(...args) {
        return this.googleDatastore.createQuery(...args);
    }
    runQuery() {
        return Promise.resolve([[], { moreResults: 'MORE_RESULT', __ref: this }]);
    }
    transaction() {
        return { __ref: this };
    }
    int(value) {
        return this.googleDatastore.int(value);
    }
    double(value) {
        return this.googleDatastore.double(value);
    }
    geoPoint(value) {
        return this.googleDatastore.geoPoint(value);
    }
    get MORE_RESULTS_AFTER_LIMIT() {
        return this.googleDatastore.MORE_RESULTS_AFTER_LIMIT;
    }
    get MORE_RESULTS_AFTER_CURSOR() {
        return this.googleDatastore.MORE_RESULTS_AFTER_CURSOR;
    }
    get NO_MORE_RESULTS() {
        return this.googleDatastore.NO_MORE_RESULTS;
    }
    get KEY() {
        return this.googleDatastore.KEY;
    }
}
exports.default = (options) => new Datastore(options);
