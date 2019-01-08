"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const operators_1 = require("rxjs/operators");
const config_1 = require("./config");
const observable_mongo_1 = require("./observable-mongo");
const observable_mongo_2 = require("./observable-mongo");
const observable_mongo_3 = require("./observable-mongo");
const observable_mongo_4 = require("./observable-mongo");
const observable_mongo_5 = require("./observable-mongo");
const observable_mongo_6 = require("./observable-mongo");
const observable_mongo_7 = require("./observable-mongo");
const observable_mongo_8 = require("./observable-mongo");
describe('mongo observable functions chained', () => {
    it(`1 - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then inserts one object and queries the collection`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testColl';
        let connectedClient;
        const manyObjectsToInsert = [
            { name: 'Lucy3' },
            { name: 'Tony3' },
            { name: 'Andrea3' }
        ];
        const oneObjectToInsert = { anotherName: 'Buba1' };
        let objectsQueried = new Array();
        observable_mongo_1.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_7.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_4.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(_ => collection))), operators_1.switchMap(collection => observable_mongo_5.insertOneObs(oneObjectToInsert, collection).pipe(operators_1.map(obectIDs => ({ obectIDs, collection })))), operators_1.switchMap(data => observable_mongo_6.findObs(data.collection)))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
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
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
    it(`2 - connects to db, drops a collection, re-create the collection, 
        inserts one object, then updates the object
        then insert many objects and update them and eventually queries the collection
        to check the updates`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate';
        let connectedClient;
        const oneObjectToInsert = { anotherName: 'Buba2' };
        const oneObjectFilter = oneObjectToInsert;
        const oneObjectAnotherProperty = 'One more';
        const oneObjectValuesToUpdate = { oneObjectAnotherProperty };
        const manyObjectsToInsert = [
            { aName: 'Bubo1' },
            { aName: 'Bubo2' }
        ];
        const manyObjectsFilter = { aName: /^Bubo/ };
        const manyObjectsAnotherProperty = 'One more';
        const manyObjectsValuesToUpdate = { manyObjectsAnotherProperty };
        let objectsQueried = new Array();
        observable_mongo_1.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_7.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertOneObs(oneObjectToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_8.updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_4.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_8.updateManyObs(manyObjectsFilter, manyObjectsValuesToUpdate, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_6.findObs(collection)))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
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
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
    it(`3 - connects to db, drops a collection, re-create the collection, 
        inserts one object via update and upsert option, then updates the object 
        and eventually queries the collection to check the updates`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate1';
        let connectedClient;
        const oneObjectToUpsert = { anotherName: 'Pente1' };
        const oneObjectFilter = oneObjectToUpsert;
        const oneObjectAnotherProperty = 'Pente property';
        const oneObjectValuesToUpdate = { oneObjectAnotherProperty };
        let objectsQueried = new Array();
        observable_mongo_1.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_7.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_8.updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_8.updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_6.findObs(collection)))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            const numberOfObjectsExpected = 1;
            let errMsg;
            if (objectsQueried.length !== numberOfObjectsExpected) {
                errMsg = 'Number of objects queried ' + objectsQueried.length +
                    ' not equal to ' + numberOfObjectsExpected;
                console.error(errMsg);
                done(errMsg);
            }
            if (objectsQueried[0]['oneObjectAnotherProperty'] !== oneObjectAnotherProperty) {
                console.log(objectsQueried[0][oneObjectAnotherProperty]);
                errMsg = 'Object0.0 not as expected ' + objectsQueried[0];
                console.error(errMsg);
                done(errMsg);
            }
            if (objectsQueried[0]['anotherName'] !== oneObjectToUpsert.anotherName) {
                errMsg = 'Object0.1 not as expected ' + objectsQueried[0];
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
    it(`4 - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then run aggregation logic`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollAggregate';
        let connectedClient;
        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' }
        ];
        let objectsQueried = new Array();
        const aggregationPipeline = [{ $group: { _id: { class: "$class" } } }];
        observable_mongo_1.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_7.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_4.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(obectIDs => ({ obectIDs, collection })))), operators_1.switchMap(data => observable_mongo_8.aggregateObs(data.collection, aggregationPipeline)))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            let errMsg;
            if (objectsQueried.length !== 2) {
                errMsg = 'Number of objects aggregated ' + objectsQueried.length +
                    ' not equal to number of objects expected';
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
});
//# sourceMappingURL=observable-mongo.spec.js.map