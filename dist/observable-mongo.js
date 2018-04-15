"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
require("rxjs/add/observable/bindNodeCallback");
const _ = require("lodash");
const mongodb_1 = require("mongodb");
// ============================ CONNECT ================================
// Returns an Observable which emits when the connection is established
function connectObs(uri) {
    return _connectObs(uri);
}
exports.connectObs = connectObs;
const fConnect = (uri, cb) => mongodb_1.MongoClient.connect(uri, cb);
const _connectObs = Observable_1.Observable.bindNodeCallback(fConnect);
// ============================ COLLECTIONS ================================
// Returns an Observable which emits when the collections names are read and ready
function collectionsObs(db) {
    return Observable_1.Observable.bindNodeCallback(db.collections).call(db);
}
exports.collectionsObs = collectionsObs;
// ALTERNATIVE VERSION USING "Observable.create" method
// export function collectionsObs(db: Db): Observable<Collection<any>[]> {
//     return Observable.create((observer: Observer<Collection<any>[]>): TeardownLogic => {
//         db.collections((err, results) => {
//             if(err) observer.error(err);
//             observer.next(results);
//             observer.complete();
//         })
//     })
// }
// ============================ COLLECTION ================================
// Returns an Observable which emits when the collections names are read and ready
function collectionObs(db, name) {
    return Observable_1.Observable.bindNodeCallback(db.collection).call(db, name);
}
exports.collectionObs = collectionObs;
// ALTERNATIVE VERSION USING "Observable.create" method
// export function collectionsObs(db: Db): Observable<Collection<any>[]> {
//     return Observable.create((observer: Observer<Collection<any>[]>): TeardownLogic => {
//         db.collections((err, results) => {
//             if(err) observer.error(err);
//             observer.next(results);
//             observer.complete();
//         })
//     })
// }
// ============================ CREATE COLLECTION ================================
// Returns an Observable which emits when the collection is created
function createCollectionObs(name, db) {
    const _createCollectionObs = Observable_1.Observable.bindNodeCallback(db.createCollection).call(db, name);
    return _createCollectionObs;
}
exports.createCollectionObs = createCollectionObs;
// ALTERNATIVE VERSION USING "Observable.create" method
// export function createCollectionObs(name: string, db: Db): Observable<Collection<any>[]> {
//     return Observable.create((observer: Observer<Collection<any>>): TeardownLogic => {
//         db.createCollection(name, (err, results) => {
//             if(err) observer.error(err);
//             observer.next(results);
//             observer.complete();
//         })
//     })
// }
// ============================ INSERT ONE ================================
// Returns an Observable which emits when the Objects have been inserted
function insertOneObs(object, collection) {
    return Observable_1.Observable.create((observer) => {
        collection.insertOne(object, (err, result) => {
            if (err)
                observer.error(err);
            observer.next(_.values(result.insertedId));
            observer.complete();
        });
    });
}
exports.insertOneObs = insertOneObs;
// ============================ INSERT MANY ================================
// Returns an Observable which emits when the Objects have been inserted
function insertManyObs(objects, collection) {
    return Observable_1.Observable.create((observer) => {
        collection.insertMany(objects, (err, result) => {
            if (err)
                observer.error(err);
            observer.next(_.values(result.insertedIds));
            observer.complete();
        });
    });
}
exports.insertManyObs = insertManyObs;
// ============================ FIND (query) ================================
// Returns an Observable which emits each object found by the query
function findObs(collection, queryConditions) {
    const queryObj = queryConditions ? queryConditions : {};
    const queryCursor = collection.find(queryObj);
    return Observable_1.Observable.create((observer) => {
        queryCursor.forEach(doc => observer.next(doc), () => observer.complete());
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
    return Observable_1.Observable.create((observer) => {
        collection.drop((err, results) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if (err && err.code !== 26)
                observer.error(err);
            observer.next(results);
            observer.complete();
        });
    });
}
exports.dropObs = dropObs;
//# sourceMappingURL=observable-mongo.js.map