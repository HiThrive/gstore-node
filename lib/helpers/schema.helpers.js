/**
 * To improve performance and avoid looping over and over the entityData or Schema config
 * we generate a meta object to cache useful data used later in models and entities methods.
 */
const extractMetaFromSchema = (paths) => {
    const meta = {};
    Object.keys(paths).forEach((k) => {
        const propType = paths[k].type;
        const stringType = propType !== undefined && propType.name ? propType.name : propType;
        switch (stringType) {
            case 'geoPoint':
                // This allows us to automatically convert valid lng/lat objects
                // to Datastore.geoPoints
                meta.geoPointsProps = meta.geoPointsProps || [];
                meta.geoPointsProps.push(k);
                break;
            case 'entityKey':
                meta.refProps = meta.refProps || {};
                meta.refProps[k] = true;
                break;
            case 'Date':
                meta.dateProps = meta.dateProps || [];
                meta.dateProps.push(k);
                break;
            default:
        }
    });
    return meta;
};
export default { extractMetaFromSchema };
