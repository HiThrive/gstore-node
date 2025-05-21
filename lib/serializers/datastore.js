import is from 'is';
import arrify from 'arrify';
import GstoreEntity from '../entity';
const getExcludeFromIndexes = (data, entity) => Object.entries(data)
    .filter(([, value]) => value !== null)
    .map(([key]) => entity.schema.excludedFromIndexes[key])
    .filter((v) => v !== undefined)
    .reduce((acc, arr) => [...acc, ...arr], []);
const idFromKey = (key) => key.path[key.path.length - 1];
const toDatastore = (entity, options = {}) => {
    const data = Object.entries(entity.entityData).reduce((acc, [key, value]) => {
        if (typeof value !== 'undefined') {
            acc[key] = value;
        }
        return acc;
    }, {});
    const excludeFromIndexes = getExcludeFromIndexes(data, entity);
    const datastoreFormat = {
        key: entity.entityKey,
        data,
        excludeLargeProperties: entity.schema.options.excludeLargeProperties,
    };
    if (excludeFromIndexes.length > 0) {
        datastoreFormat.excludeFromIndexes = excludeFromIndexes;
    }
    if (options.method) {
        datastoreFormat.method = options.method;
    }
    return datastoreFormat;
};
const fromDatastore = (entityData, Model, options = {}) => {
    const getEntityKey = () => {
        let keyData = entityData[Model.gstore.ds.KEY];
        // datastore can return id as a string however we need to ensure that the path
        // is correctly a number in order to return the correct entity key
        if (keyData.id && typeof keyData.id !== 'number') {
            const path = [...keyData.path];
            const id = Number(path.pop());
            // if id is still not a number then we ignore since it is either really a string or another non-number type
            if (!isNaN(id)) {
                keyData = {
                    ...keyData,
                    id,
                    path: [...path, Number(id)],
                };
            }
        }
        if (Model.gstore.ds.isKey(keyData)) {
            return keyData;
        }
        return Model.gstore.ds.key(keyData);
    };
    const convertToJson = () => {
        options.readAll = typeof options.readAll === 'undefined' ? false : options.readAll;
        const { schema, gstore } = Model;
        const { KEY } = gstore.ds;
        const entityKey = getEntityKey();
        const data = {
            id: idFromKey(entityKey),
        };
        data[KEY] = entityKey;
        Object.keys(entityData).forEach((k) => {
            if (options.readAll || !{}.hasOwnProperty.call(schema.paths, k) || schema.paths[k].read !== false) {
                let value = entityData[k];
                if ({}.hasOwnProperty.call(schema.paths, k)) {
                    // During queries @google-cloud converts datetime to number
                    if (schema.paths[k].type && schema.paths[k].type.name === 'Date' && is.number(value)) {
                        value = new Date(value / 1000);
                    }
                    // Sanitise embedded objects
                    if (typeof schema.paths[k].excludeFromRead !== 'undefined' &&
                        is.array(schema.paths[k].excludeFromRead) &&
                        !options.readAll) {
                        schema.paths[k].excludeFromRead.forEach((prop) => {
                            const segments = prop.split('.');
                            let v = value;
                            while (segments.length > 1 && v !== undefined) {
                                v = v[segments.shift()];
                            }
                            const segment = segments.pop();
                            if (v !== undefined && segment in v) {
                                delete v[segment];
                            }
                        });
                    }
                }
                data[k] = value;
            }
        });
        if (options.showKey) {
            data.__key = entityKey;
        }
        else {
            delete data.__key;
        }
        return data;
    };
    const convertToEntity = () => {
        const key = getEntityKey();
        return new Model(entityData, undefined, undefined, undefined, key);
    };
    switch (options.format) {
        case 'ENTITY':
            return convertToEntity();
        default:
            return convertToJson();
    }
};
/**
 * Convert one or several entities instance (gstore) to Datastore format
 *
 * @param {any} entities Entity(ies) to format
 * @returns {array} the formated entity(ies)
 */
const entitiesToDatastore = (entities, options = {}) => {
    const isMultiple = is.array(entities);
    const entitiesToArray = arrify(entities);
    if (entitiesToArray[0] instanceof GstoreEntity !== true) {
        // Not an entity instance, nothing to do here...
        return entities;
    }
    const result = entitiesToArray.map((e) => toDatastore(e, options));
    return isMultiple ? result : result[0];
};
export default {
    toDatastore,
    fromDatastore,
    entitiesToDatastore,
};
