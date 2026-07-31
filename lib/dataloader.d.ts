import { Datastore } from '@google-cloud/datastore';
import DataLoader from 'dataloader';
import { EntityKey, EntityData } from './types';
/**
 * Create a DataLoader instance
 * @param {Datastore} ds @google-cloud Datastore instance
 */
export declare const createDataLoader: (ds: Datastore, options?: {
    maxBatchSize: number;
}) => DataLoader<EntityKey[] | EntityKey, EntityData>;
