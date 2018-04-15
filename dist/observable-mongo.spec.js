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
describe('mongo observable functions chained', () => {
    it(`connects to db, drops a collection, re-create the collection, 
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
        const oneObjectsToInsert = { anotherName: 'Buba1' };
        let objectsQueried = new Array();
        observable_mongo_1.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_7.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_4.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(_ => collection))), operators_1.switchMap(collection => observable_mongo_5.insertOneObs(oneObjectsToInsert, collection).pipe(operators_1.map(obectIDs => ({ obectIDs, collection })))), operators_1.switchMap(data => observable_mongo_6.findObs(data.collection)))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            if (objectsQueried.length !== manyObjectsToInsert.length + 1) {
                const errMsg = 'Number of objects queried ' + objectsQueried.length +
                    ' not equal to number of objects inserted ' + manyObjectsToInsert.length + 1;
                console.error(errMsg);
                done(errMsg);
            }
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
});
//# sourceMappingURL=observable-mongo.spec.js.map