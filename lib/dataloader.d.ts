import { Datastore } from '@google-cloud/datastore';
import DataLoader from 'dataloader';
import { EntityData } from './types';
/**
 * Create a DataLoader instance
 * @param {Datastore} ds @google-cloud Datastore instance
 */
export declare const createDataLoader: (ds: Datastore, options?: {
    maxBatchSize: number;
} | undefined) => DataLoader<import("@google-cloud/datastore/build/src/entity").entity.Key | import("@google-cloud/datastore/build/src/entity").entity.Key[], EntityData<{
    [key: string]: any;
}>>;
