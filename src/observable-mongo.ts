
import { Observable } from 'rxjs/Observable';
import { Observer} from 'rxjs/Observer';
import {TeardownLogic} from 'rxjs/Subscription';
import 'rxjs/add/observable/bindNodeCallback';

import * as _ from 'lodash';

import { MongoClient } from "mongodb";
import { MongoCallback } from "mongodb";
import { Db } from "mongodb";
import { Collection } from "mongodb";
import { ObjectID } from "mongodb";

// ============================ CONNECT ================================
// Returns an Observable which emits when the connection is established
export function connectObs(uri: string) {
    return _connectObs(uri);
}
const fConnect = (uri: string, cb: MongoCallback<MongoClient>) => MongoClient.connect(uri, cb);
const _connectObs = Observable.bindNodeCallback(fConnect);

// ============================ COLLECTIONS ================================
// Returns an Observable which emits when the collections names are read and ready
export function collectionsObs(db: Db): Observable<Collection<any>[]> {
    return Observable.bindNodeCallback(db.collections).call(db);
}
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
export function collectionObs(db: Db, name: string): Observable<Collection<any>> {
    return Observable.bindNodeCallback(db.collection).call(db, name);
}
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
export function createCollectionObs(name: string, db: Db): Observable<Collection<{}>> {
    const _createCollectionObs = Observable.bindNodeCallback(db.createCollection).call(db, name);
    return _createCollectionObs;
}
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



// ============================ INSERT MANY ================================
// Returns an Observable which emits when the Objects have been inserted
export function insertManyObs(objects: Array<{}>, collection: Collection<any>): Observable<Array<ObjectID>> {
    return Observable.create((observer: Observer<Array<ObjectID>>): TeardownLogic => {
        collection.insertMany(objects, (err, result) => {
            if(err) observer.error(err);
            observer.next(_.values(result.insertedIds));
            observer.complete();
        })
    })
}




// ============================ FIND (query) ================================
// Returns an Observable which emits each object found by the query
export function findObs(collection: Collection<any>, queryConditions?: any): Observable<any> {
    const queryObj = queryConditions ? queryConditions : {};
    const queryCursor = collection.find(queryObj);
    return Observable.create((observer: Observer<any>): TeardownLogic => {
                            queryCursor.forEach(
                                doc => observer.next(doc),
                                () => observer.complete()
                            )
                        })
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
    return Observable.create((observer: Observer<any>): TeardownLogic => {
        collection.drop((err, results) => {
            // error code 26 states that "NamespaceNotFound", i.e. the collection is not present - in this case we ignore the error
            if(err && err.code !== 26) observer.error(err);
            observer.next(results);
            observer.complete();
        })
    })
}

