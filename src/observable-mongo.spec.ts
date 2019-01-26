
import 'mocha';

import { switchMap, map, toArray } from 'rxjs/operators';

import { MongoClient } from 'mongodb';

import {config} from './config';

import { connectObs } from './observable-mongo';
import { collectionObs } from './observable-mongo';
import { createCollectionObs } from './observable-mongo';
import { insertManyObs } from './observable-mongo';
import { insertOneObs } from './observable-mongo';
import { findObs } from './observable-mongo';
import { dropObs } from './observable-mongo';
import { updateOneObs, updateManyObs, aggregateObs, createIndexObs, removeObs } from './observable-mongo';

describe('mongo observable functions chained', () => {

    it(`1 insertOne - connects to db, drops a collection, re-create the collection, 
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

    it(`2 update - connects to db, drops a collection, re-create the collection, 
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

    it(`3 update - connects to db, drops a collection, re-create the collection, 
        inserts one object via update and upsert option, then updates the object 
        and eventually queries the collection to check the updates`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate1';
        let connectedClient: MongoClient;

        const oneObjectToUpsert = {anotherName: 'Pente1'};
        const oneObjectFilter = oneObjectToUpsert;
        const oneObjectAnotherProperty = 'Pente property';
        const oneObjectValuesToUpdate = {oneObjectAnotherProperty};

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
            switchMap(collection => updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, {upsert: true}).pipe(map(() => collection))),
            switchMap(collection => updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, {upsert: true}).pipe(map(() => collection))),
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
                
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            }
        )

    }).timeout(10000);

    it(`4 aggregate - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then run aggregation logic`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollAggregate';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {name: 'Lucy3', class: 'first'},
            {name: 'Tony3', class: 'second'},
            {name: 'Andrea3', class: 'first'}
        ];

        let objectsQueried = new Array<object>();
        const aggregationPipeline = [{ $group: {_id: {class: "$class"} } }];

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
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(obectIDs => ({obectIDs, collection})))),
            switchMap(data => aggregateObs(data.collection, aggregationPipeline))
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
                let errMsg: string;
                if (objectsQueried.length !== 2) {
                    errMsg = 'Number of objects aggregated ' + objectsQueried.length + 
                                    ' not equal to number of objects expected';
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

    it(`5 add index - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add an index on a field`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndex';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {name: 'Lucy3', class: 'first'},
            {name: 'Tony3', class: 'second'},
            {name: 'Andrea3', class: 'first'}
        ];

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
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => createIndexObs({name: 1}, null, collection)),
        )
        .subscribe(
            null,
            err => {
                console.error('err', err);
                done(err);
            },
            () => {
                done();
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            }
        )

    }).timeout(10000);

    it(`6 add index  - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add a unique index on 2 fields which contain some repetitions`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {name: 'Lucy3', class: 'first'},
            {name: 'Tony3', class: 'second'},
            {name: 'Andrea3', class: 'first'},
            {name: 'Lucy3', class: 'first'},
        ];

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
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => createIndexObs({name: 1, class: 1}, {unique: true}, collection)),
        )
        .subscribe(
            null,
            err => {
                if (err.code === 11000) {
                    done();
                } else {
                    console.error('err', err);
                    done(err);
                };
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            },
            () => {
                done();
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
                console.log('Should not reach here');
                throw('Should not reach here');
            }
        )

    }).timeout(10000);

    it(`7 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const objectToInsert = {name: 'Tom', class: 'first'};

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
            switchMap(collection => createIndexObs({name: 1, class: 1}, {unique: true}, collection)),
            switchMap(collection => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
        )
        .subscribe(
            null,
            err => {
                if (err.code === 11000) {
                    done();
                } else {
                    console.error('err', err);
                    done(err);
                };
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            },
            () => {
                done();
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
                console.log('Should not reach here');
                throw('Should not reach here');
            }
        )

    }).timeout(10000);

    it(`8 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key using insertMany`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const objectToInsert = {name: 'Tom', class: 'first'};

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
            switchMap(collection => createIndexObs({name: 1, class: 1}, {unique: true}, collection)),
            switchMap(collection => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => insertManyObs([objectToInsert], collection).pipe(map(() => collection))),
        )
        .subscribe(
            null,
            err => {
                if (err.code === 11000) {
                    // I execute done() after a timeout to make sure I test the fact that the 'next' method within the createOsbervable
                    // Observer function is not hit in case of error
                    setTimeout(() => {
                        done();
                    }, 100);
                } else {
                    console.error('err', err);
                    done(err);
                };
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            },
            () => {
                done();
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
                console.log('Should not reach here');
                throw('Should not reach here');
            }
        )

    }).timeout(10000);

    it(`9 remove - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then remove them`, done => {

        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollRemove';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {name: 'Lucy3', class: 'remove'},
            {name: 'Tony3', class: 'remove'},
            {name: 'Andrea3', class: 'keep'}
        ];

        const selector = {class: "remove"};

        connectObs(uri)
        .pipe(
            switchMap(client => {
                connectedClient = client;
                const db = client.db(dbName);
                return collectionObs(db, collectionName).pipe(map(collection => {return {collection, client}}));
            }),
            switchMap(data => dropObs(data.collection).pipe(map(() => data.client))),
            switchMap(client => {
                const db = client.db(dbName);
                return createCollectionObs(collectionName, db);
            }),
            switchMap(collection => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
            switchMap(collection => removeObs(selector, collection).pipe(map(() => collection))),
            switchMap(collection => findObs(collection)),
            toArray()
        )
        .subscribe(
            objects => {
                console.log('objects removed', objects);
                let errMsg: string;
                if (objects.length !== 1) {
                    errMsg = 'Number of objects left in the collection ' + objects.length + 
                                    ' not equal to number of objects expected';
                    console.error(errMsg);
                    done(errMsg);
                }
                if (!errMsg) {
                    done();
                }
            },
            err => {
                console.error('err', err);
                done(err);
            },
            () => {
                connectedClient.close().then(
                    () => console.log('Connection closed'),
                    err => console.error('Error while closing the connection', err)
                );
            }
        )

    }).timeout(10000);

});
