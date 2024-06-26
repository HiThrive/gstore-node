"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Transaction() {
    this.run = () => undefined;
    this.get = () => undefined;
    this.save = () => undefined;
    this.delete = () => undefined;
    this.commit = () => Promise.resolve();
    this.rollback = () => Promise.resolve();
    this.createQuery = () => ({
        filter: () => undefined,
        scope: this,
    });
    this.runQuery = () => Promise.resolve();
}
Transaction.prototype.name = 'Transaction';
exports.default = Transaction;
