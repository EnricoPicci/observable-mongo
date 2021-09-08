import { Observable } from 'rxjs';
import { MongoClient, CreateCollectionOptions, UpdateResult, Document as MongoDoc, DeleteResult, ObjectId, UpdateOptions, ReplaceOptions, FindCursor } from 'mongodb';
import { Db } from 'mongodb';
import { Collection } from 'mongodb';
export declare function connectObs(uri: string): Observable<MongoClient>;
export declare function collectionsObs(db: Db): Observable<Collection<any>[]>;
export declare function collectionObs(db: Db, name: string): Observable<Collection<any>>;
export declare function createCollectionObs(name: string, db: Db, options?: CreateCollectionOptions): Observable<Collection<any>>;
export declare function createIndexObs(fieldNames: any, options: any, collection: Collection): Observable<Collection>;
export declare function insertOneObs(object: any, collection: Collection<any>): Observable<ObjectId>;
export declare function insertManyObs(objects: Array<any>, collection: Collection<any>): Observable<Array<ObjectId>>;
export declare let qc: FindCursor<any>;
export declare function findObs(collection: Collection<any>, queryConditions?: any, options?: any): Observable<any>;
export declare function dropObs(collection: Collection<any>): Observable<any>;
export declare function updateOneObs(filter: any, dataToUpdate: any, collection: Collection<any>, options?: UpdateOptions & {
    upsert?: boolean;
}): Observable<UpdateResult>;
export declare function updateManyObs(filter: any, dataToUpdate: any, collection: Collection<any>, options?: UpdateOptions & {
    upsert?: boolean;
}): Observable<MongoDoc | UpdateResult>;
export declare function containsUpdateOperators(data: any): boolean;
export declare function replaceOneObs(filter: any, documentToReplaceWith: any, collection: Collection<any>, options?: ReplaceOptions & {
    upsert?: boolean;
}): Observable<MongoDoc | UpdateResult>;
export declare function deleteObs(selector: any, collection: Collection<any>): Observable<DeleteResult>;
export declare function aggregateObs(collection: Collection<any>, aggregationPipeline: Array<any>): Observable<any>;
export declare function distinctObs(collection: Collection<any>, key: string, query?: any, options?: any): Observable<Array<any>>;
