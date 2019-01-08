import { Observable } from 'rxjs';
import { MongoClient } from "mongodb";
import { Db } from "mongodb";
import { Collection } from "mongodb";
import { ObjectID } from "mongodb";
import { UpdateWriteOpResult } from 'mongodb';
import { CommonOptions } from 'mongodb';
export declare function connectObs(uri: string): Observable<MongoClient>;
export declare function collectionsObs(db: Db): Observable<Collection<any>[]>;
export declare function collectionObs(db: Db, name: string): Observable<Collection<any>>;
export declare function createCollectionObs(name: string, db: Db): Observable<Collection<{}>>;
export declare function insertOneObs(object: Object, collection: Collection<any>): Observable<ObjectID>;
export declare function insertManyObs(objects: Array<Object>, collection: Collection<any>): Observable<Array<ObjectID>>;
export declare function findObs(collection: Collection<any>, queryConditions?: any): Observable<any>;
export declare function dropObs(collection: Collection<any>): Observable<any>;
export declare function updateOneObs(filter: Object, dataToUpdate: Object, collection: Collection<any>, options?: CommonOptions & {
    upsert?: boolean;
}): Observable<UpdateWriteOpResult>;
export declare function updateManyObs(filter: Object, dataToUpdate: Object, collection: Collection<any>, options?: CommonOptions & {
    upsert?: boolean;
}): Observable<UpdateWriteOpResult>;
export declare function aggregateObs(collection: Collection<any>, aggregationPipeline: Array<any>): Observable<any>;
