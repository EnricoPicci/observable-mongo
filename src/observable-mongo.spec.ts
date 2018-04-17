
import 'mocha';

import { switchMap, map } from 'rxjs/operators';

import { MongoClient } from 'mongodb';

import {config} from './config';

import { connectObs } from './observable-mongo';
import { collectionObs } from './observable-mongo';
import { createCollectionObs } from './observable-mongo';
import { insertManyObs } from './observable-mongo';
import { insertOneObs } from './observable-mongo';
import { findObs } from './observable-mongo';
import { dropObs } from './observable-mongo';
import { updateOneObs, updateManyObs } from './observable-mongo';

describe('mongo observable functions chained', () => {

    it(`connects to db, drops a collection, re-create the collection, 
        inserts some objects, then inserts one object and queries the collection`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testColl';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {name: 'Lucy3'},
            {name: 'Tony3'},
            {name: 'Andrea3'}
        ];
        const oneObjectToInsert = {anotherName: 'Buba1'};

        let objectsQueried = new Array<object>();

        connectObs(uri)
        .pipe(
            switchMap(client => {
                connectedClient = client;
                const db = client.db(dbName);
                return collectionObs(db, collectionName).pipe(map(collection => {return {collection, client}}));
            }),
            switchMap(data => dropObs(data.collection).pipe(map(_d => data.client))),
            switchMap(client => {
                const db = client.db(dbName);
                return createCollectionObs(collectionName, db);
            }),
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(_ => collection))),
            switchMap(collection => insertOneObs(oneObjectToInsert, collection).pipe(map(obectIDs => ({obectIDs, collection})))),
            switchMap(data => findObs(data.collection))
        )
        .subscribe(
            object => {
                console.log('obj', object);
                objectsQueried.push(object);
            },
            err => {
                console.error('err', err);
                done(err);
            },
            () => {
                let errMsg;
                if (objectsQueried.length !== manyObjectsToInsert.length + 1) {
                    errMsg = 'Number of objects queried ' + objectsQueried.length + 
                                    ' not equal to number of objects inserted ' + manyObjectsToInsert.length + 1;
                    console.error(errMsg);
                    done(errMsg);
                }
                if (!errMsg) {
                    done();
                }
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            }
        )

    }).timeout(10000);

    it(`connects to db, drops a collection, re-create the collection, 
        inserts one object, then updates the object
        then insert many objects and update them and eventually queries the collection
        to check the updates`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate';
        let connectedClient: MongoClient;

        const oneObjectToInsert = {anotherName: 'Buba2'};
        const oneObjectFilter = oneObjectToInsert;
        const oneObjectAnotherProperty = 'One more';
        const oneObjectValuesToUpdate = {oneObjectAnotherProperty};
        const manyObjectsToInsert = [
                    {aName: 'Bubo1'},
                    {aName: 'Bubo2'}
                ];
        const manyObjectsFilter = {aName: /^Bubo/};
        const manyObjectsAnotherProperty = 'One more';
        const manyObjectsValuesToUpdate = {manyObjectsAnotherProperty};

        let objectsQueried = new Array<object>();

        connectObs(uri)
        .pipe(
            switchMap(client => {
                connectedClient = client;
                const db = client.db(dbName);
                return collectionObs(db, collectionName).pipe(map(collection => ({collection, client})));
            }),
            switchMap(data => dropObs(data.collection).pipe(map(_d => data.client))),
            switchMap(client => {
                const db = client.db(dbName);
                return createCollectionObs(collectionName, db);
            }),
            switchMap(collection => insertOneObs(oneObjectToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection).pipe(map(() => collection))),
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => updateManyObs(manyObjectsFilter, manyObjectsValuesToUpdate, collection).pipe(map(() => collection))),
            switchMap(collection => findObs(collection))
        )
        .subscribe(
            object => {
                console.log('obj', object);
                objectsQueried.push(object);
            },
            err => {
                console.error('err', err);
                done(err);
            },
            () => {
                const numberOfObjectsExpected = 1 + manyObjectsToInsert.length;
                let errMsg;
                if (objectsQueried.length !== numberOfObjectsExpected) {
                    errMsg = 'Number of objects queried ' + objectsQueried.length + 
                                    ' not equal to ' + numberOfObjectsExpected;
                    console.error(errMsg);
                    done(errMsg);
                }
                if (objectsQueried[0]['oneObjectAnotherProperty'] !== oneObjectAnotherProperty) {
                    console.log(objectsQueried[0][oneObjectAnotherProperty]);
                    errMsg = 'Object0 not as expected ' + objectsQueried[0];
                    console.error(errMsg);
                    done(errMsg);
                }
                if (objectsQueried[1]['manyObjectsAnotherProperty'] !== manyObjectsAnotherProperty) {
                    errMsg = 'Object1 not as expected ' + objectsQueried[1];
                    console.error(errMsg);
                    done(errMsg);
                }
                if (objectsQueried[2]['manyObjectsAnotherProperty'] !== manyObjectsAnotherProperty) {
                    errMsg = 'Object2 not as expected ' + objectsQueried[2];
                    console.error(errMsg);
                    done(errMsg);
                }
                if (!errMsg) {
                    done();
                }
                
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            }
        )

    }).timeout(10000);

});
