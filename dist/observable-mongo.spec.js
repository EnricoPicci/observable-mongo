"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
require("rxjs/add/operator/switchMap");
require("rxjs/add/operator/map");
require("rxjs/add/operator/do");
const config_1 = require("./config");
const observable_mongo_1 = require("./observable-mongo");
const observable_mongo_2 = require("./observable-mongo");
const observable_mongo_3 = require("./observable-mongo");
const observable_mongo_4 = require("./observable-mongo");
const observable_mongo_5 = require("./observable-mongo");
const observable_mongo_6 = require("./observable-mongo");
describe('mongo observable functions chained', () => {
    it('connects to db, drops a collection, re-create the collection, inserts 3 objects, query the collection', done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testColl';
        let connectedClient;
        const objectsToInsert = [
            { name: 'Lucy3' },
            { name: 'Tony3' },
            { name: 'Andrea3' }
        ];
        let objectsQueried = new Array();
        observable_mongo_1.connectObs(uri)
            .switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_2.collectionObs(db, collectionName).map(collection => { return { collection, client }; });
        })
            .switchMap(data => observable_mongo_6.dropObs(data.collection).map(_d => data.client))
            .switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_3.createCollectionObs(collectionName, db);
        })
            .switchMap(collection => observable_mongo_4.insertManyObs(objectsToInsert, collection).map(obectIDs => {
            return { obectIDs, collection };
        }))
            .switchMap(data => observable_mongo_5.findObs(data.collection))
            .subscribe(object => {
            console.log('obj', object);
            objectsQueried.push(object);
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            if (objectsQueried.length !== objectsToInsert.length) {
                const errMsg = 'Number of objects queried ' + objectsQueried.length + ' not equal to number of objects inserted ' + objectsToInsert.length;
                console.error(errMsg);
                done(errMsg);
            }
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(10000);
});
//# sourceMappingURL=observable-mongo.spec.js.map