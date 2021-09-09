/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { from, Observable, of } from 'rxjs';
import { Observer } from 'rxjs';
import { TeardownLogic } from 'rxjs';
import { bindNodeCallback } from 'rxjs';
// import 'rxjs/add/observable/bindNodeCallback';
// import 'rxjs/add/observable/fromPromise';

import * as _ from 'lodash';

import {
    MongoClient,
    CreateCollectionOptions,
    UpdateResult,
    Document as MongoDoc,
    DeleteResult,
    ObjectId,
    UpdateOptions,
    ReplaceOptions,
    MongoError,
    FindCursor,
} from 'mongodb';
import { Db } from 'mongodb';
import { Collection } from 'mongodb';

// ============================ CONNECT ================================
// Returns an Observable which emits when the connection is established
export function connectObs(uri: string) {
    return from(new MongoClient(uri).connect());
}

// ============================ COLLECTIONS ================================
// Returns an Observable which emits when the collections names are read and ready
export function collectionsObs(db: Db): Observable<Collection<any>[]> {
    return bindNodeCallback(db.collections).call(db);
}
// ALTERNATIVE VERSION USING "Observable.create" method
// export function collectionsObs(db: Db): Observable<Collection<any>[]> {
//     return Observable.create((observer: Observer<Collection<any>[]>): TeardownLogic => {
//         db.collections((err, results) => {
//             if(err) {
//                 observer.error(err);
//                 return;
//             }
//             observer.next(results);
//             observer.complete();
//         })
//     })
// }

// ============================ COLLECTION ================================
// Returns an Observable which emits when the collections names are read and ready
export function collectionObs(db: Db, name: string): Observable<Collection<any>> {
    return of(db.collection(name));
}

// ============================ CREATE COLLECTION ================================
// Returns an Observable which emits when the collection is created
export function createCollectionObs(
    name: string,
    db: Db,
    options?: CreateCollectionOptions,
): Observable<Collection<any>> {
    const _createCollectionObs = bindNodeCallback(db.createCollection).call(db, name, options);
    return _createCollectionObs;
}
// ALTERNATIVE VERSION USING "Observable.create" method
// export function createCollectionObs(name: string, db: Db): Observable<Collection<any>[]> {
//     return Observable.create((observer: Observer<Collection<any>>): TeardownLogic => {
//         db.createCollection(name, (err, results) => {
//         if(err) {
//             observer.error(err);
//             return;
//         }
//             observer.next(results);
//             observer.complete();
//         })
//     })
// }

// ============================ CREATE INDEX ================================
// Returns an Observable which emits when the index is created - the object notified is the Collection itself
// ALTERNATIVE VERSION USING "Observable.create" method
export function createIndexObs(fieldNames: any, options: any, collection: Collection): Observable<Collection> {
    return new Observable((observer: Observer<any>): TeardownLogic => {
        collection.createIndex(fieldNames, options, (err) => {
            if (err) {
                observer.error(err);
                return;
            }
            observer.next(collection);
            observer.complete();
        });
    });
}

// ============================ INSERT ONE ================================
// Returns an Observable which emits when the Object has been inserted
export function insertOneObs(object: any, collection: Collection<any>) {
    return new Observable((observer: Observer<ObjectId>): TeardownLogic => {
        collection.insertOne(object, (err, result) => {
            if (err) {
                observer.error(err);
                return;
            }
            observer.next(result.insertedId);
            observer.complete();
        });
    });
}

// ============================ INSERT MANY ================================
// Returns an Observable which emits when the Objects have been inserted
export function insertManyObs(objects: Array<any>, collection: Collection<any>): Observable<Array<ObjectId>> {
    return new Observable((observer: Observer<Array<ObjectId>>): TeardownLogic => {
        collection.insertMany(objects, (err, result) => {
            // In this case it is important to add the "else" condition to discriminate what
            // we do in case of non error, where we get the "insertedIds" propertyt from the result
            // If we do not add such "else" the function fails in case an error occurs because we would
            // try anyways to get "insertedIds" from result, which when an error occurs is null
            if (err) {
                observer.error(err);
            } else {
                observer.next(_.values(result.insertedIds));
                observer.complete();
            }
        });
    });
}

// ============================ FIND (query) ================================
// Returns an Observable which emits each object found by the query
export let qc: FindCursor<any>; // qc is exported only to allow tests on the correct closing of the cursor
export function findObs(collection: Collection<any>, queryConditions?: any, options?: any): Observable<any> {
    const queryObj = queryConditions ? queryConditions : {};
    const optionsObj = options ? options : {};
    const queryCursor = collection.find(queryObj, optionsObj);
    qc = queryCursor;
    return new Observable((observer: Observer<any>): TeardownLogic => {
        queryCursor.forEach(
            (doc) => {
                try {
                    observer.next(doc);
                } catch (err) {
                    observer.error(err);
                }
            },
            () => observer.complete(),
        );
        return () => {
            queryCursor.close();
        };
    });
}
// THE FOLLOWING VERSION CAN NOT BE USED SINCE IT NEVER FIRES THE COMPLETE EVENT
// export function findObs(collection: Collection<any>, queryConditions?: any) {
//     const queryObj = queryConditions ? queryConditions : {};
//     const queryCursor = collection.find(queryObj);
//     return Observable.fromEvent<any>(queryCursor, 'data');
// }

// ============================ DROP COLLECTION ================================
// Returns an Observable which emits when the collection is dropped
// export function dropObs(collection: Collection<any>): Observable<any> {
//     return Observable.bindNodeCallback(collection.drop).call(collection);
// }
// ALTERNATIVE VERSION USING "Observable.create" method - preferred to use this version to be able to control the error codes
export function dropObs(collection: Collection<any>): Observable<any> {
    return new Observable((observer: Observer<any>): TeardownLogic => {
        collection.drop((err, results) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if (err && err instanceof MongoError && err.code !== 26) observer.error(err);
            observer.next(results);
            observer.complete();
        });
    });
}
export function dropCollectionObs(name: string, db: Db): Observable<boolean> {
    return new Observable((observer: Observer<any>): TeardownLogic => {
        db.dropCollection(name, (err, result) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if (err && err instanceof MongoError && err.code !== 26) observer.error(err);
            observer.next(result);
            observer.complete();
        });
    });
}

// ============================ UPDATE ONE ================================
// Returns an Observable which emits when the first Object selected by the filter has been updated
// if the dataToUpdate object contains a mongo update operator (https://docs.mongodb.com/manual/reference/operator/update/)
// then the object is passed as it is to the update function
// otherwise, if it is a simple data object, the $set operator is used as default
export function updateOneObs(
    filter: any,
    dataToUpdate: any,
    collection: Collection<any>,
    options?: UpdateOptions & { upsert?: boolean },
): Observable<UpdateResult> {
    const data = buildObjectForUpdate(dataToUpdate);
    return new Observable((observer: Observer<UpdateResult>): TeardownLogic => {
        collection.updateOne(filter, data, options, (err, result) => {
            if (err) {
                observer.error(err);
            } else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}

// ============================ UPDATE MANY ================================
// Returns an Observable which emits when the Objects selected by the filter have been updated
// if the dataToUpdate object contains a mongo update operator (https://docs.mongodb.com/manual/reference/operator/update/)
// then the object is passed as it is to the update function
// otherwise, if it is a simple data object, the $set operator is used as default
export function updateManyObs(
    filter: any,
    dataToUpdate: any,
    collection: Collection<any>,
    options?: UpdateOptions & { upsert?: boolean },
) {
    const data = buildObjectForUpdate(dataToUpdate);
    return new Observable((observer: Observer<MongoDoc | UpdateResult>): TeardownLogic => {
        collection.updateMany(filter, data, options, (err, result) => {
            if (err) {
                observer.error(err);
            } else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}
// this function is exported only to allow test
export function containsUpdateOperators(data: any) {
    const keys = Object.keys(data);
    const firstKey = keys.length > 0 ? keys[0] : null;
    const firstCharOfFirstKey = firstKey ? firstKey[0] : null;
    return firstCharOfFirstKey === '$';
}
function buildObjectForUpdate(data) {
    return containsUpdateOperators(data) ? data : { $set: data };
}

// =========================== REPLACE ONE =================================
// Returns an Observable which emits when the Object selected by the filter is replaced
export function replaceOneObs(
    filter: any,
    documentToReplaceWith: any,
    collection: Collection<any>,
    options?: ReplaceOptions & { upsert?: boolean },
) {
    return new Observable((observer: Observer<MongoDoc | UpdateResult>): TeardownLogic => {
        collection.replaceOne(filter, documentToReplaceWith, options, (err, result) => {
            if (err) {
                observer.error(err);
            } else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}

// ============================ REMOVE ================================
// Returns an Observable which emits when the documents selected via the selector have been removed
export function deleteObs(selector: any, collection: Collection<any>) {
    return new Observable((observer: Observer<DeleteResult>): TeardownLogic => {
        collection.deleteMany(selector, (err, result) => {
            if (err) {
                observer.error(err);
            } else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}

// ============================ AGGREGATE ================================
// Returns an Observable which emits each document returned by the aggregation logic
export function aggregateObs(collection: Collection<any>, aggregationPipeline: Array<any>): Observable<any> {
    const aggregationCursor: any = collection.aggregate(aggregationPipeline);
    return new Observable((observer: Observer<any>): TeardownLogic => {
        aggregationCursor.forEach(
            (doc) => {
                try {
                    observer.next(doc);
                } catch (err) {
                    observer.error(err);
                }
            },
            () => observer.complete(),
        );
        return () => {
            aggregationCursor.close();
        };
    });
}

// ============================ DISTINCT ================================
// Returns an Observable which emits each document returned by the aggregation logic
export function distinctObs(
    collection: Collection<any>,
    key: string,
    query?: any,
    options?: any,
): Observable<Array<any>> {
    return new Observable((observer: Observer<any>): TeardownLogic => {
        collection.distinct(key, query, options, (err, result) => {
            if (err) {
                observer.error(err);
                return;
            }
            observer.next(result);
            observer.complete();
        });
    });
}
