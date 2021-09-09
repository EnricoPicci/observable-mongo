/* eslint-disable @typescript-eslint/no-explicit-any */

import 'mocha';
import { expect } from 'chai';

import { switchMap, map, delay, toArray, take, tap, concatMap } from 'rxjs/operators';

import { MongoClient, Collection } from 'mongodb';

import { config } from './config';

import { qc, replaceOneObs, containsUpdateOperators, dropCollectionObs, collectionsObs } from './observable-mongo';

import { connectObs } from './observable-mongo';
import { collectionObs } from './observable-mongo';
import { createCollectionObs } from './observable-mongo';
import { insertManyObs } from './observable-mongo';
import { insertOneObs } from './observable-mongo';
import { findObs } from './observable-mongo';
import { dropObs } from './observable-mongo';
import { Subject, Observable } from 'rxjs';
import { updateOneObs, updateManyObs, aggregateObs, createIndexObs, deleteObs, distinctObs } from './observable-mongo';

describe('mongo observable functions chained', () => {
    it(`1 insertOne - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then inserts one object and queries the collection`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testColl';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [{ name: 'Lucy3' }, { name: 'Tony3' }, { name: 'Andrea3' }];
        const oneObjectToInsert = { anotherName: 'Buba1' };

        const objectsQueried = new Array<any>();

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                concatMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                concatMap((collection) =>
                    insertOneObs(oneObjectToInsert, collection).pipe(map((obectID) => ({ obectID, collection }))),
                ),
                tap((data) => {
                    expect(typeof data.obectID).to.equal('object');
                    expect(typeof data.obectID.toHexString()).to.be.not.undefined;
                }),
                concatMap((data) => findObs(data.collection)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectsQueried.push(object);
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    let errMsg;
                    if (objectsQueried.length !== manyObjectsToInsert.length + 1) {
                        errMsg =
                            'Number of objects queried ' +
                            objectsQueried.length +
                            ' not equal to number of objects inserted ' +
                            manyObjectsToInsert.length +
                            1;
                        console.error(errMsg);
                        done(errMsg);
                    }
                    if (!errMsg) {
                        done();
                    }
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`2 update - connects to db, drops a collection, re-create the collection, 
        inserts one object, then updates the object
        then insert many objects and update them and eventually queries the collection
        to check the updates`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate';
        let connectedClient: MongoClient;

        const oneObjectToInsert = { anotherName: 'Buba2' };
        const oneObjectFilter = oneObjectToInsert;
        const oneObjectAnotherProperty = 'One more';
        const oneObjectValuesToUpdate = { oneObjectAnotherProperty };
        const manyObjectsToInsert = [{ aName: 'Bubo1' }, { aName: 'Bubo2' }];
        const manyObjectsFilter = { aName: /^Bubo/ };
        const manyObjectsAnotherProperty = 'One more';
        const manyObjectsValuesToUpdate = { manyObjectsAnotherProperty };

        const objectsQueried = new Array<any>();

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(map((collection) => ({ collection, client })));
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertOneObs(oneObjectToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) =>
                    updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection).pipe(map(() => collection)),
                ),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) =>
                    updateManyObs(manyObjectsFilter, manyObjectsValuesToUpdate, collection).pipe(map(() => collection)),
                ),
                switchMap((collection) => findObs(collection)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectsQueried.push(object);
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    const numberOfObjectsExpected = 1 + manyObjectsToInsert.length;
                    let errMsg;
                    if (objectsQueried.length !== numberOfObjectsExpected) {
                        errMsg =
                            'Number of objects queried ' +
                            objectsQueried.length +
                            ' not equal to ' +
                            numberOfObjectsExpected;
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
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`3 update - connects to db, drops a collection, re-create the collection, 
        inserts one object via update and upsert option, then updates the object 
        and eventually queries the collection to check the updates`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate1';
        let connectedClient: MongoClient;

        const oneObjectToUpsert = { anotherName: 'Pente1' };
        const oneObjectFilter = oneObjectToUpsert;
        const oneObjectAnotherProperty = 'Pente property';
        const oneObjectValuesToUpdate = { oneObjectAnotherProperty };

        const objectsQueried = new Array<any>();

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(map((collection) => ({ collection, client })));
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) =>
                    updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, { upsert: true }).pipe(
                        map(() => collection),
                    ),
                ),
                switchMap((collection) =>
                    updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, { upsert: true }).pipe(
                        map(() => collection),
                    ),
                ),
                switchMap((collection) => findObs(collection)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectsQueried.push(object);
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    const numberOfObjectsExpected = 1;
                    let errMsg;
                    if (objectsQueried.length !== numberOfObjectsExpected) {
                        errMsg =
                            'Number of objects queried ' +
                            objectsQueried.length +
                            ' not equal to ' +
                            numberOfObjectsExpected;
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
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`3.1.1 check if an empty object contains an update operator`, () => {
        const data = {};
        expect(containsUpdateOperators(data)).to.be.false;
    });
    it(`3.1.2 check if an object with data fields contains an update operator`, () => {
        const data = { firstName: 'a', lastName: 'b' };
        expect(containsUpdateOperators(data)).to.be.false;
    });
    it(`3.1.3 check if an object with update operators fields contains an update operator`, () => {
        const data = {
            $set: {
                county: 'Pierce',
                state: 'WA',
            },
            $push: {
                zips: {
                    $each: ['98499', '98499'],
                },
            },
        };
        expect(containsUpdateOperators(data)).to.be.true;
    });

    it(`3.2 update - connects to db, drops a collection, re-create the collection, 
        inserts one object via update and upsert option, 
        then adds a new item in an array contained in the object just added via $push update operator
        and eventually queries the collection to check the updates`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate32';
        let connectedClient: MongoClient;

        const oneObjectToUpsert = { anotherName: 'Pente32', anArray: ['first item'] };
        const oneObjectFilter = oneObjectToUpsert;
        const oneObjectAnotherItemToAddToArray = 'second item';
        const oneObjectValuesToUpdate = { $push: { anArray: oneObjectAnotherItemToAddToArray } };

        let objectQueried;

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(map((collection) => ({ collection, client })));
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) =>
                    updateOneObs(oneObjectFilter, oneObjectToUpsert, collection, { upsert: true }).pipe(
                        map(() => collection),
                    ),
                ),
                switchMap((collection) =>
                    updateOneObs(oneObjectFilter, oneObjectValuesToUpdate, collection, { upsert: true }).pipe(
                        map(() => collection),
                    ),
                ),
                switchMap((collection) => findObs(collection)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectQueried = object;
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
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

                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`4 aggregate - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then run aggregation logic`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollAggregate';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' },
        ];

        const objectsQueried = new Array<any>();
        const aggregationPipeline = [{ $group: { _id: { class: '$class' } } }];

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) =>
                    insertManyObs(manyObjectsToInsert, collection).pipe(map((obectIDs) => ({ obectIDs, collection }))),
                ),
                switchMap((data) => aggregateObs(data.collection, aggregationPipeline)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectsQueried.push(object);
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    let errMsg: string;
                    if (objectsQueried.length !== 2) {
                        errMsg =
                            'Number of objects aggregated ' +
                            objectsQueried.length +
                            ' not equal to number of objects expected';
                        console.error(errMsg);
                        done(errMsg);
                    }
                    if (!errMsg) {
                        done();
                    }
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`5 add index - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add an index on a field`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndex';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' },
        ];

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => createIndexObs({ name: 1 }, null, collection)),
            )
            .subscribe({
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`6 add index  - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then add a unique index on 2 fields which contain some repetitions`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'first' },
            { name: 'Tony3', class: 'second' },
            { name: 'Andrea3', class: 'first' },
            { name: 'Lucy3', class: 'first' },
        ];

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)),
            )
            .subscribe({
                error: (err) => {
                    if (err.code === 11000) {
                        done();
                    } else {
                        console.error('err', err);
                        done(err);
                    }
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                    console.log('Should not reach here');
                    throw 'Should not reach here';
                },
            });
    }).timeout(20000);

    it(`7 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const objectToInsert = { name: 'Tom', class: 'first' };

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)),
                switchMap((collection) => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
            )
            .subscribe({
                error: (err) => {
                    if (err.code === 11000) {
                        done();
                    } else {
                        console.error('err', err);
                        done(err);
                    }
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                    console.log('Should not reach here');
                    throw 'Should not reach here';
                },
            });
    }).timeout(20000);

    it(`8 add index  - connects to db, drops a collection, re-create the collection, 
        adds a unique index and then tries to write 2 objects with the same key using insertMany`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollIndexFail';
        let connectedClient: MongoClient;

        const objectToInsert = { name: 'Tom', class: 'first' };

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => createIndexObs({ name: 1, class: 1 }, { unique: true }, collection)),
                switchMap((collection) => insertOneObs(objectToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => insertManyObs([objectToInsert], collection).pipe(map(() => collection))),
            )
            .subscribe({
                error: (err) => {
                    if (err.code === 11000) {
                        // I execute done() after a timeout to make sure I test the fact that the 'next' method within the createOsbervable
                        // Observer function is not hit in case of error
                        setTimeout(() => {
                            done();
                        }, 100);
                    } else {
                        console.error('err', err);
                        done(err);
                    }
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                    console.log('Should not reach here');
                    throw 'Should not reach here';
                },
            });
    }).timeout(20000);

    it(`9 remove - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then removes them`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollRemove';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            { name: 'Lucy3', class: 'remove' },
            { name: 'Tony3', class: 'remove' },
            { name: 'Andrea3', class: 'keep' },
        ];

        const selector = { class: 'remove' };

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => deleteObs(selector, collection).pipe(map(() => collection))),
                switchMap((collection) => findObs(collection)),
                toArray(),
            )
            .subscribe({
                next: (objects) => {
                    console.log('objects removed', objects);
                    let errMsg: string;
                    if (objects.length !== 1) {
                        errMsg =
                            'Number of objects left in the collection ' +
                            objects.length +
                            ' not equal to number of objects expected';
                        console.error(errMsg);
                        done(errMsg);
                    }
                    if (!errMsg) {
                        done();
                    }
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`10 distinct - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then calculates the distinct values`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollDistinct';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff1', event: 'event1' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff2', event: 'event1' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff3', event: 'event1' },
            { thekey: { key1: 'efg', key2: 'xyz' }, stuff: 'stuff4', event: 'event1' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2' },
            { thekey: { key1: 'abc', key2: 'cde' }, stuff: 'stuff5', event: 'event1' },
            { thekey: { key1: '123', key2: '456' }, stuff: 'stuff4', event: 'event2' },
        ];

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => distinctObs(collection, 'thekey', { event: 'event1' })),
            )
            .subscribe({
                next: (objects) => {
                    let errMsg: string;
                    // we expect 2 objects, since we select only entries for event1
                    if (objects.length !== 2) {
                        errMsg =
                            'Number of distinct objects ' + objects.length + ' not equal to number of objects expected';
                        console.error(errMsg);
                        done(errMsg);
                    }
                    if (!errMsg) {
                        done();
                    }
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`11 distinct - connects to db, drops a collection, re-create the collection, 
        inserts some objects, then query some objects with some projection`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollFindProjection';
        let connectedClient: MongoClient;

        const manyObjectsToInsert = [
            {
                thekey: { key1: 'abc', key2: 'cde' },
                stuff: 'stuff1',
                event: 'event1',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: 'efg', key2: 'xyz' },
                stuff: 'stuff2',
                event: 'event1',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: 'abc', key2: 'cde' },
                stuff: 'stuff3',
                event: 'event1',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: 'efg', key2: 'xyz' },
                stuff: 'stuff4',
                event: 'event1',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: '123', key2: '456' },
                stuff: 'stuff4',
                event: 'event2',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: 'abc', key2: 'cde' },
                stuff: 'stuff5',
                event: 'event1',
                dataNotToProject: 'dataNotToProject',
            },
            {
                thekey: { key1: '123', key2: '456' },
                stuff: 'stuff4',
                event: 'event2',
                dataNotToProject: 'dataNotToProject',
            },
        ];

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) =>
                    findObs(collection, { event: 'event1' }, { projection: { dataNotToProject: 0 } }),
                ),
                toArray(),
            )
            .subscribe({
                next: (objects) => {
                    let errMsg: string;
                    // we expect 5 objects, since we select only entries for event1
                    if (objects.length !== 5) {
                        errMsg = 'Number of objects ' + objects.length + ' not equal to number of objects expected';
                        console.error(errMsg);
                        done(errMsg);
                    }
                    // we expect each of the objects retrieve NOT to have 'dataNotToProject' property
                    objects.forEach((obj) => {
                        if (obj.dataNotToProject) {
                            errMsg = 'dataNotToProject should not be present';
                            console.error(errMsg);
                            done(errMsg);
                        }
                    });
                    if (!errMsg) {
                        done();
                    }
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`12 find - connects to db, drops a collection, re-create the collection, 
    inserts some objects, queries the collection and take only the first element
    This test checks also that the cursor is closed by the tearDownLogic of findObs`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollFindTake1';
        let connectedClient: MongoClient;

        let objectQueried: any;

        const manyObjectsToInsert = [{ name: 'Mary' }, { name: 'Tob' }, { name: 'Alan' }];

        const mongoObsCompleted = new Subject<any>();

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertManyObs(manyObjectsToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) => findObs(collection)),
                take(1),
            )
            .subscribe({
                next: (obj) => {
                    objectQueried = obj;
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    console.log(objectQueried);
                    expect(objectQueried).to.deep.equal(manyObjectsToInsert[0]);
                    expect(qc.closed).to.be.false;
                    mongoObsCompleted.next(null);
                },
            });

        mongoObsCompleted.pipe(delay(0)).subscribe(() => {
            expect(qc.closed).to.be.true;
            done();
            connectedClient.close().then(
                () => console.log('Connection closed'),
                (err) => console.error('Error while closing the connection', err),
            );
        });
    }).timeout(20000);

    it(`13 replace - connects to db, drops a collection, re-create the collection, 
        inserts one object, then replaces the object
        then insert many objects and replace them and eventually queries the collection
        to check the replacements`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollUpdate';
        let connectedClient: MongoClient;

        const oneObjectToInsert = { anotherName: 'Buba2' };
        const oneObjectFilter = oneObjectToInsert;
        const oneObjectToReplace = { anotherName: 'One more' };

        const objectsQueried = new Array<any>();

        connectObs(uri)
            .pipe(
                switchMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(map((collection) => ({ collection, client })));
                }),
                switchMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                switchMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                switchMap((collection) => insertOneObs(oneObjectToInsert, collection).pipe(map(() => collection))),
                switchMap((collection) =>
                    replaceOneObs(oneObjectFilter, oneObjectToReplace, collection).pipe(map(() => collection)),
                ),
                switchMap((collection) => findObs(collection)),
            )
            .subscribe({
                next: (object) => {
                    console.log('obj', object);
                    objectsQueried.push(object);
                },
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    const numberOfObjectsExpected = 1;
                    let errMsg;
                    if (objectsQueried.length !== numberOfObjectsExpected) {
                        errMsg =
                            'Number of objects queried ' +
                            objectsQueried.length +
                            ' not equal to ' +
                            numberOfObjectsExpected;
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

                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`14 createCollection with options - connects to db, drops a collection, re-create the collection
        with options to specify that queries are not case sensitive, 
        inserts some objects, then queries the collection`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollNotCaseSensitive';
        let connectedClient: MongoClient;
        let collection: Collection<any>;

        const manyObjectsToInsert = [{ name: 'Lucy' }, { name: 'LUCY' }, { name: 'lucy' }, { name: 'Tony' }];

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db, { collation: { locale: 'en_US', strength: 2 } });
                }),
                tap((coll) => (collection = coll)),
                concatMap(() => insertManyObs(manyObjectsToInsert, collection)),
                concatMap(() => findObs(collection, { name: 'luCY' })),
                toArray(),
                tap((data) => {
                    // there are 3 lucies whose name is the same just with different cases
                    expect(data.length).to.equal(3);
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                    console.error('err', err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`15 dropCollectionObs - connects to db, drops a collection, re-create the collection, 
        drops the collection again and then check that the collection is not there`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollToBeDropped-' + Date.now().toString();
        let connectedClient: MongoClient;

        connectObs(uri)
            .pipe(
                tap((client) => {
                    connectedClient = client;
                }),
                concatMap(() => dropCollectionObs(collectionName, connectedClient.db(dbName))),
                concatMap(() => createCollectionObs(collectionName, connectedClient.db(dbName))),
                // fetch all the collections and check that a collection with name equal to collectionName is there
                concatMap(() => collectionsObs(connectedClient.db(dbName))),
                tap((collections) => {
                    expect(collections.filter((c) => c.collectionName === collectionName).length).equal(1);
                }),
                concatMap(() => dropCollectionObs(collectionName, connectedClient.db(dbName))),
                // fetch all the collections and check that collectionName is NOT there any more since it hs been dropped
                concatMap(() => collectionsObs(connectedClient.db(dbName))),
                tap((collections) => {
                    expect(collections.filter((c) => c.collectionName === collectionName).length).equal(0);
                }),
            )
            .subscribe({
                error: (err) => {
                    console.error('err', err);
                    done(err);
                },
                complete: () => {
                    connectedClient
                        .close()
                        .then(
                            () => console.log('Connection closed'),
                            (err) => console.error('Error while closing the connection', err),
                        )
                        .finally(() => done());
                },
            });
    }).timeout(20000);
});

describe(`if operations are first built and executed they behave correctly -  these tests are to check that the observables
are actually cold (i.e. execute only when subscribed) and do not hide a Promise which instead would
execute immediately`, () => {
    it(`1.1 creates a deleteObs observable and then executes it later`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollForDeleteCreatedFirstAndThenExecuted';
        let connectedClient: MongoClient;
        let collection: Collection<any>;

        const thingName = 'thing to delete';
        const manyObjectsToInsert = [{ name: thingName }, { name: 'stuff' }];

        let deleteOperation: Observable<any>;

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                tap((coll) => (collection = coll)),
                concatMap(() => insertManyObs(manyObjectsToInsert, collection)),
                // create the delete operation
                tap(() => {
                    deleteOperation = deleteObs({ name: thingName }, collection);
                }),
                // wait some time
                delay(10),
                // read and find still the stuff loaded into the collection
                concatMap(() => findObs(collection, {})),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(manyObjectsToInsert.length);
                }),
                // wait some more time
                delay(10),
                // execute the delete operation
                concatMap(() => deleteOperation),
                // now the collection should have one element less
                concatMap(() => findObs(collection, {})),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(manyObjectsToInsert.length - 1);
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                    console.error('err', err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`1.2 creates a replaceOneObs observable and then executes it later`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollForReplaceOneObsCreatedFirstAndThenExecuted';
        let connectedClient: MongoClient;
        let collection: Collection<any>;

        const originalThingName = 'thing to replace';
        const newThingName = 'the new thing';
        const manyObjectsToInsert = [{ name: originalThingName }, { name: 'stuff' }];

        let replaceOneOperation: Observable<any>;

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                tap((coll) => (collection = coll)),
                concatMap(() => insertManyObs(manyObjectsToInsert, collection)),
                // create the replaceOne operation
                tap(() => {
                    replaceOneOperation = replaceOneObs(
                        { name: originalThingName },
                        { name: newThingName },
                        collection,
                    );
                }),
                // wait some time
                delay(10),
                // read and find still the stuff loaded into the collection
                concatMap(() => findObs(collection, { name: originalThingName })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(1);
                }),
                // wait some more time
                delay(10),
                // execute the replaceOne operation
                concatMap(() => replaceOneOperation),
                // now the old object should not be there anymore
                concatMap(() => findObs(collection, { name: originalThingName })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(0);
                }),
                // while we should find the new object
                concatMap(() => findObs(collection, { name: newThingName })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(1);
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                    console.error('err', err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`1.3 creates a updateManyObs observable and then executes it later`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollForUpdateManyObsCreatedFirstAndThenExecuted';
        let connectedClient: MongoClient;
        let collection: Collection<any>;

        const idOfThingToUpdate = 'id of things to update';
        const originalContent = 'original content';
        const newContent = 'new content';
        const manyObjectsToInsert = [
            { id: idOfThingToUpdate, content: originalContent },
            { id: idOfThingToUpdate, content: originalContent },
            { is: 'new id', content: 'something else' },
        ];

        let updateManyOperation: Observable<any>;

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                tap((coll) => (collection = coll)),
                concatMap(() => insertManyObs(manyObjectsToInsert, collection)),
                // create the replaceOne operation
                tap(() => {
                    updateManyOperation = updateManyObs({ id: idOfThingToUpdate }, { content: newContent }, collection);
                }),
                // wait some time
                delay(10),
                // read and find still the stuff loaded into the collection
                concatMap(() => findObs(collection, { id: idOfThingToUpdate })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(2);
                    data.map((d) => expect(d.content).to.equal(originalContent));
                }),
                // wait some more time
                delay(10),
                // execute the updateManyObs operation
                concatMap(() => updateManyOperation),
                // now the new content should be there
                concatMap(() => findObs(collection, { id: idOfThingToUpdate })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(2);
                    data.map((d) => expect(d.content).to.equal(newContent));
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                    console.error('err', err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);

    it(`1.4 creates a updateOneObs observable and then executes it later`, (done) => {
        const uri = config.mongoUri;
        const dbName = 'mydb';
        const collectionName = 'testCollForUpdateOneObsCreatedFirstAndThenExecuted';
        let connectedClient: MongoClient;
        let collection: Collection<any>;

        const idOfThingToUpdate = 'id of things to update';
        const originalContent = 'original content';
        const newContent = 'new content';
        const manyObjectsToInsert = [
            { id: idOfThingToUpdate, content: originalContent },
            { id: idOfThingToUpdate, content: originalContent },
            { is: 'new id', content: 'something else' },
        ];

        let updateOneOperation: Observable<any>;

        connectObs(uri)
            .pipe(
                concatMap((client) => {
                    connectedClient = client;
                    const db = client.db(dbName);
                    return collectionObs(db, collectionName).pipe(
                        map((collection) => {
                            return { collection, client };
                        }),
                    );
                }),
                concatMap((data) => dropObs(data.collection).pipe(map(() => data.client))),
                concatMap((client) => {
                    const db = client.db(dbName);
                    return createCollectionObs(collectionName, db);
                }),
                tap((coll) => (collection = coll)),
                concatMap(() => insertManyObs(manyObjectsToInsert, collection)),
                // create the replaceOne operation
                tap(() => {
                    updateOneOperation = updateOneObs({ id: idOfThingToUpdate }, { content: newContent }, collection);
                }),
                // wait some time
                delay(10),
                // read and find still the stuff loaded into the collection
                concatMap(() => findObs(collection, { id: idOfThingToUpdate })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(2);
                    data.map((d) => expect(d.content).to.equal(originalContent));
                }),
                // wait some more time
                delay(10),
                // execute the updateManyObs operation
                concatMap(() => updateOneOperation),
                // now the new content should be there
                concatMap(() => findObs(collection, { id: idOfThingToUpdate })),
                toArray(),
                tap((data) => {
                    expect(data.length).to.equal(2);
                    expect(data.filter((d) => d.content === newContent).length).to.equal(1);
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                    console.error('err', err);
                },
                complete: () => {
                    done();
                    connectedClient.close().then(
                        () => console.log('Connection closed'),
                        (err) => console.error('Error while closing the connection', err),
                    );
                },
            });
    }).timeout(20000);
});
