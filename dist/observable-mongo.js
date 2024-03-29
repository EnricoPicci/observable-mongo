"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinctObs = exports.aggregateObs = exports.deleteObs = exports.replaceOneObs = exports.containsUpdateOperators = exports.updateManyObs = exports.updateOneObs = exports.dropCollectionObs = exports.dropObs = exports.findObs = exports.qc = exports.insertManyObs = exports.insertOneObs = exports.createIndexObs = exports.createCollectionObs = exports.collectionObs = exports.collectionsObs = exports.connectObs = void 0;
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
// import 'rxjs/add/observable/bindNodeCallback';
// import 'rxjs/add/observable/fromPromise';
const _ = require("lodash");
const mongodb_1 = require("mongodb");
// ============================ CONNECT ================================
// Returns an Observable which emits when the connection is established
function connectObs(uri) {
    return (0, rxjs_1.from)(new mongodb_1.MongoClient(uri).connect());
}
exports.connectObs = connectObs;
// ============================ COLLECTIONS ================================
// Returns an Observable which emits when the collections names are read and ready
function collectionsObs(db) {
    return (0, rxjs_2.bindNodeCallback)(db.collections).call(db);
}
exports.collectionsObs = collectionsObs;
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
function collectionObs(db, name) {
    return (0, rxjs_1.of)(db.collection(name));
}
exports.collectionObs = collectionObs;
// ============================ CREATE COLLECTION ================================
// Returns an Observable which emits when the collection is created
function createCollectionObs(name, db, options) {
    const _createCollectionObs = (0, rxjs_2.bindNodeCallback)(db.createCollection).call(db, name, options);
    return _createCollectionObs;
}
exports.createCollectionObs = createCollectionObs;
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
function createIndexObs(fieldNames, options, collection) {
    return new rxjs_1.Observable((observer) => {
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
exports.createIndexObs = createIndexObs;
// ============================ INSERT ONE ================================
// Returns an Observable which emits when the Object has been inserted
function insertOneObs(object, collection) {
    return new rxjs_1.Observable((observer) => {
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
exports.insertOneObs = insertOneObs;
// ============================ INSERT MANY ================================
// Returns an Observable which emits when the Objects have been inserted
function insertManyObs(objects, collection) {
    return new rxjs_1.Observable((observer) => {
        collection.insertMany(objects, (err, result) => {
            // In this case it is important to add the "else" condition to discriminate what
            // we do in case of non error, where we get the "insertedIds" propertyt from the result
            // If we do not add such "else" the function fails in case an error occurs because we would
            // try anyways to get "insertedIds" from result, which when an error occurs is null
            if (err) {
                observer.error(err);
            }
            else {
                observer.next(_.values(result.insertedIds));
                observer.complete();
            }
        });
    });
}
exports.insertManyObs = insertManyObs;
function findObs(collection, queryConditions, options) {
    const queryObj = queryConditions ? queryConditions : {};
    const optionsObj = options ? options : {};
    const queryCursor = collection.find(queryObj, optionsObj);
    exports.qc = queryCursor;
    return new rxjs_1.Observable((observer) => {
        queryCursor.forEach((doc) => {
            try {
                observer.next(doc);
            }
            catch (err) {
                observer.error(err);
            }
        }, () => observer.complete());
        return () => {
            queryCursor.close();
        };
    });
}
exports.findObs = findObs;
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
function dropObs(collection) {
    return new rxjs_1.Observable((observer) => {
        collection.drop((err, results) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if (err && err instanceof mongodb_1.MongoError && err.code !== 26)
                observer.error(err);
            observer.next(results);
            observer.complete();
        });
    });
}
exports.dropObs = dropObs;
function dropCollectionObs(name, db) {
    return new rxjs_1.Observable((observer) => {
        db.dropCollection(name, (err, result) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if (err && err instanceof mongodb_1.MongoError && err.code !== 26)
                observer.error(err);
            observer.next(result);
            observer.complete();
        });
    });
}
exports.dropCollectionObs = dropCollectionObs;
// ============================ UPDATE ONE ================================
// Returns an Observable which emits when the first Object selected by the filter has been updated
// if the dataToUpdate object contains a mongo update operator (https://docs.mongodb.com/manual/reference/operator/update/)
// then the object is passed as it is to the update function
// otherwise, if it is a simple data object, the $set operator is used as default
function updateOneObs(filter, dataToUpdate, collection, options) {
    const data = buildObjectForUpdate(dataToUpdate);
    return new rxjs_1.Observable((observer) => {
        collection.updateOne(filter, data, options, (err, result) => {
            if (err) {
                observer.error(err);
            }
            else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}
exports.updateOneObs = updateOneObs;
// ============================ UPDATE MANY ================================
// Returns an Observable which emits when the Objects selected by the filter have been updated
// if the dataToUpdate object contains a mongo update operator (https://docs.mongodb.com/manual/reference/operator/update/)
// then the object is passed as it is to the update function
// otherwise, if it is a simple data object, the $set operator is used as default
function updateManyObs(filter, dataToUpdate, collection, options) {
    const data = buildObjectForUpdate(dataToUpdate);
    return new rxjs_1.Observable((observer) => {
        collection.updateMany(filter, data, options, (err, result) => {
            if (err) {
                observer.error(err);
            }
            else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}
exports.updateManyObs = updateManyObs;
// this function is exported only to allow test
function containsUpdateOperators(data) {
    const keys = Object.keys(data);
    const firstKey = keys.length > 0 ? keys[0] : null;
    const firstCharOfFirstKey = firstKey ? firstKey[0] : null;
    return firstCharOfFirstKey === '$';
}
exports.containsUpdateOperators = containsUpdateOperators;
function buildObjectForUpdate(data) {
    return containsUpdateOperators(data) ? data : { $set: data };
}
// =========================== REPLACE ONE =================================
// Returns an Observable which emits when the Object selected by the filter is replaced
function replaceOneObs(filter, documentToReplaceWith, collection, options) {
    return new rxjs_1.Observable((observer) => {
        collection.replaceOne(filter, documentToReplaceWith, options, (err, result) => {
            if (err) {
                observer.error(err);
            }
            else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}
exports.replaceOneObs = replaceOneObs;
// ============================ REMOVE ================================
// Returns an Observable which emits when the documents selected via the selector have been removed
function deleteObs(selector, collection) {
    return new rxjs_1.Observable((observer) => {
        collection.deleteMany(selector, (err, result) => {
            if (err) {
                observer.error(err);
            }
            else {
                observer.next(result);
                observer.complete();
            }
        });
    });
}
exports.deleteObs = deleteObs;
// ============================ AGGREGATE ================================
// Returns an Observable which emits each document returned by the aggregation logic
function aggregateObs(collection, aggregationPipeline) {
    const aggregationCursor = collection.aggregate(aggregationPipeline);
    return new rxjs_1.Observable((observer) => {
        aggregationCursor.forEach((doc) => {
            try {
                observer.next(doc);
            }
            catch (err) {
                observer.error(err);
            }
        }, () => observer.complete());
        return () => {
            aggregationCursor.close();
        };
    });
}
exports.aggregateObs = aggregateObs;
// ============================ DISTINCT ================================
// Returns an Observable which emits each document returned by the aggregation logic
function distinctObs(collection, key, query, options) {
    return new rxjs_1.Observable((observer) => {
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
exports.distinctObs = distinctObs;
//# sourceMappingURL=observable-mongo.js.map