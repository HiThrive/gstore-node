"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NOW = 'CURRENT_DATETIME';
const returnCurrentTime = () => new Date();
const mapDefaultValueIdToHandler = {
    [NOW]: returnCurrentTime,
};
const handler = (key) => {
    if ({}.hasOwnProperty.call(mapDefaultValueIdToHandler, key)) {
        return mapDefaultValueIdToHandler[key]();
    }
    return null;
};
const defaultValues = {
    NOW,
    __handler__: handler,
    __map__: mapDefaultValueIdToHandler,
};
exports.default = defaultValues;
