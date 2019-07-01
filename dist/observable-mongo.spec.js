"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
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
const rxjs_1 = require("rxjs");
const observable_mongo_9 = require("./observable-mongo");
describe('mongo observable functions chained', () => {
    it(`1 insertOne - connects to db, drops a collection, re-create the collection, 
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
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.concatMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.concatMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.concatMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.concatMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(_ => collection))), operators_1.concatMap(collection => observable_mongo_6.insertOneObs(oneObjectToInsert, collection).pipe(operators_1.map(obectID => ({ obectID, collection })))), operators_1.tap(data => {
            chai_1.expect(typeof data.obectID).to.equal('object');
            chai_1.expect(typeof data.obectID.toHexString()).to.be.not.undefined;
        }), operators_1.concatMap(data => observable_mongo_7.findObs(data.collection)))
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
    }).timeout(20000);
    it(`2 update - connects to db, drops a collection, re-create the collection, 
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
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_6.insertOneObs(oneObjectToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.updateManyObs(manyObjectsFilter, manyObjectsValuesToUpdate, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)))
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
    }).timeout(20000);
    it(`3 update - connects to db, drops a collection, re-create the collection, 
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
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_9.updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)))
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
    }).timeout(20000);
    it(`3.1.1 check if an empty object contains an update operator`, () => {
        const data = {};
        chai_1.expect(observable_mongo_1.containsUpdateOperators(data)).to.be.false;
    });
    it(`3.1.2 check if an object with data fields contains an update operator`, () => {
        const data = { firstName: 'a', lastName: 'b' };
        chai_1.expect(observable_mongo_1.containsUpdateOperators(data)).to.be.false;
    });
    it(`3.1.3 check if an object with update operators fields contains an update operator`, () => {
        const data = {
            '$set': {
                county: 'Pierce',
                state: 'WA'
            },
            '$push': {
                zips: {
                    '$each': ['98499',
                        '98499']
                }
            }
        };
        chai_1.expect(observable_mongo_1.containsUpdateOperators(data)).to.be.true;
    });
    it(`3.2 update - connects to db, drops a collection, re-create the collection, 
        inserts one object via update and upsert option, 
        then adds a new item in an array contained in the object just added via $push update operator
        and eventually queries the collection to check the updates`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate32';
        let connectedClient;
        const oneObjectToUpsert = { anotherName: 'Pente32', anArray: ['first item'] };
        const oneObjectFilter = oneObjectToUpsert;
        const oneObjectAnotherItemToAddToArray = 'second item';
        const oneObjectValuesToUpdate = { $push: { anArray: oneObjectAnotherItemToAddToArray } };
        let objectQueried;
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_9.updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, { upsert: true }).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)))
            .subscribe(object => {
            console.log('obj', object);
            objectQueried = object;
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            let errMsg;
            if (objectQueried.anArray.length !== 2) {
                console.log(objectQueried);
                errMsg = 'Object32 not as expected ' + objectQueried;
                console.error(errMsg);
                done(errMsg);
            }
            if (objectQueried.anArray[1] !== oneObjectAnotherItemToAddToArray) {
                console.log(objectQueried);
                errMsg = 'Item not added to the array in the object ' + objectQueried;
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`4 aggregate - connects to db, drops a collection, re-create the collection, 
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
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(obectIDs => ({ obectIDs, collection })))), operators_1.switchMap(data => observable_mongo_9.aggregateObs(data.collection, aggregationPipeline)))
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
    }).timeout(20000);
    it(`5 add index - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add an index on a field`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndex';
        let connectedClient;
        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' }
        ];
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.createIndexObs({ name: 1 }, null, collection)))
            .subscribe(null, err => {
            console.error('err', err);
            done(err);
        }, () => {
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`6 add index  - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add a unique index on 2 fields which contain some repetitions`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient;
        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' },
            { name: 'Lucy3', class: 'first' },
        ];
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)))
            .subscribe(null, err => {
            if (err.code === 11000) {
                done();
            }
            else {
                console.error('err', err);
                done(err);
            }
            ;
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        }, () => {
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
            console.log('Should not reach here');
            throw ('Should not reach here');
        });
    }).timeout(20000);
    it(`7 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient;
        const objectToInsert = { name: 'Tom', class: 'first' };
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_9.createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)), operators_1.switchMap(collection => observable_mongo_6.insertOneObs(objectToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_6.insertOneObs(objectToInsert, collection).pipe(operators_1.map(() => collection))))
            .subscribe(null, err => {
            if (err.code === 11000) {
                done();
            }
            else {
                console.error('err', err);
                done(err);
            }
            ;
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        }, () => {
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
            console.log('Should not reach here');
            throw ('Should not reach here');
        });
    }).timeout(20000);
    it(`8 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key using insertMany`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient;
        const objectToInsert = { name: 'Tom', class: 'first' };
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_9.createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)), operators_1.switchMap(collection => observable_mongo_6.insertOneObs(objectToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_5.insertManyObs([objectToInsert], collection).pipe(operators_1.map(() => collection))))
            .subscribe(null, err => {
            if (err.code === 11000) {
                // I execute done() after a timeout to make sure I test the fact that the 'next' method within the createOsbervable
                // Observer function is not hit in case of error
                setTimeout(() => {
                    done();
                }, 100);
            }
            else {
                console.error('err', err);
                done(err);
            }
            ;
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        }, () => {
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
            console.log('Should not reach here');
            throw ('Should not reach here');
        });
    }).timeout(20000);
    it(`9 remove - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then removes them`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollRemove';
        let connectedClient;
        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'remove' },
            { name: 'Tony3', class: 'remove' },
            { name: 'Andrea3', class: 'keep' }
        ];
        const selector = { class: "remove" };
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(() => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.deleteObs(selector, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)), operators_1.toArray())
            .subscribe(objects => {
            console.log('objects removed', objects);
            let errMsg;
            if (objects.length !== 1) {
                errMsg = 'Number of objects left in the collection ' + objects.length +
                    ' not equal to number of objects expected';
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`10 distinct - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then calculates the distinct values`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollDistinct';
        let connectedClient;
        const manyObjectsToInsert = [
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff1', event: 'event1' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff2', event: 'event1' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff3', event: 'event1' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff4', event: 'event1' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff5', event: 'event1' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2' },
        ];
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(() => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_9.distinctObs(collection, 'thekey', { event: 'event1' })))
            .subscribe(objects => {
            let errMsg;
            // we expect 2 objects, since we select only entries for event1
            if (objects.length !== 2) {
                errMsg = 'Number of distinct objects ' + objects.length +
                    ' not equal to number of objects expected';
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`11 distinct - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then query some objects with some projection`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollFindProjection';
        let connectedClient;
        const manyObjectsToInsert = [
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff1', event: 'event1', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff2', event: 'event1', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff3', event: 'event1', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff4', event: 'event1', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff5', event: 'event1', dataNotToProject: 'dataNotToProject' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2', dataNotToProject: 'dataNotToProject' },
        ];
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(() => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection, { event: 'event1' }, { projection: { 'dataNotToProject': 0 } })), operators_1.toArray())
            .subscribe(objects => {
            let errMsg;
            // we expect 5 objects, since we select only entries for event1
            if (objects.length !== 5) {
                errMsg = 'Number of objects ' + objects.length +
                    ' not equal to number of objects expected';
                console.error(errMsg);
                done(errMsg);
            }
            // we expect each of the objects retrieve NOT to have 'dataNotToProject' property
            objects.forEach(obj => {
                if (obj.dataNotToProject) {
                    errMsg = 'dataNotToProject should not be present';
                    console.error(errMsg);
                    done(errMsg);
                }
            });
            if (!errMsg) {
                done();
            }
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`12 find - connects to db, drops a collection, re-create the collection, 
    inserts some objects, queries the collection and take only the first element
    This test checks also that the cursor is closed by the tearDownLogic of findObs`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollFindTake1';
        let connectedClient;
        let objectQueried;
        const manyObjectsToInsert = [
            { name: 'Mary' },
            { name: 'Tob' },
            { name: 'Alan' }
        ];
        const mongoObsCompleted = new rxjs_1.Subject();
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => { return { collection, client }; }));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(() => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_5.insertManyObs(manyObjectsToInsert, collection).pipe(operators_1.map(_ => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)), operators_1.take(1))
            .subscribe(obj => {
            objectQueried = obj;
        }, err => {
            console.error('err', err);
            done(err);
        }, () => {
            console.log(objectQueried);
            chai_1.expect(objectQueried).to.deep.equal(manyObjectsToInsert[0]);
            chai_1.expect(observable_mongo_1.qc.isClosed()).to.be.false;
            mongoObsCompleted.next();
        });
        mongoObsCompleted
            .pipe(operators_1.delay(0))
            .subscribe(() => {
            chai_1.expect(observable_mongo_1.qc.isClosed()).to.be.true;
            done();
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
    it(`13 replace - connects to db, drops a collection, re-create the collection, 
        inserts one object, then replaces the object
        then insert many objects and replace them and eventually queries the collection
        to check the replacements`, done => {
        const uri = config_1.config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate';
        let connectedClient;
        const oneObjectToInsert = { anotherName: 'Buba2' };
        const oneObjectFilter = oneObjectToInsert;
        const oneObjectToReplace = { anotherName: 'One more' };
        let objectsQueried = new Array();
        observable_mongo_2.connectObs(uri)
            .pipe(operators_1.switchMap(client => {
            connectedClient = client;
            const db = client.db(dbName);
            return observable_mongo_3.collectionObs(db, collectionName).pipe(operators_1.map(collection => ({ collection, client })));
        }), operators_1.switchMap(data => observable_mongo_8.dropObs(data.collection).pipe(operators_1.map(_d => data.client))), operators_1.switchMap(client => {
            const db = client.db(dbName);
            return observable_mongo_4.createCollectionObs(collectionName, db);
        }), operators_1.switchMap(collection => observable_mongo_6.insertOneObs(oneObjectToInsert, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_1.replaceOneObs(oneObjectFilter, oneObjectToReplace, collection).pipe(operators_1.map(() => collection))), operators_1.switchMap(collection => observable_mongo_7.findObs(collection)))
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
            if (objectsQueried[0]['anotherName'] !== oneObjectToReplace.anotherName) {
                errMsg = 'Object1 not as expected ' + objectsQueried[0];
                console.error(errMsg);
                done(errMsg);
            }
            if (!errMsg) {
                done();
            }
            connectedClient.close().then(() => console.log('Connection closed'), err => console.error('Error while closing the connection', err));
        });
    }).timeout(20000);
});
//# sourceMappingURL=observable-mongo.spec.js.map