// Some authors names are stored in the 'Authors' Mongo collection
// You want to read 'Authors' and, for each author, fetch the first n titles of her/his books
// from a remote rest service (we use openlibrary project in this example) 


import { switchMap, tap,  mergeMap, map, } from 'rxjs/operators';
import { MongoClient, Collection } from 'mongodb';

import {connectObs, dropObs, createCollectionObs, insertManyObs, findObs} from '../observable-mongo';
import {httpGetRequestObs} from 'observable-http-request';

import {config} from '../config';

// setup - load the authors in the collection
const uri = config.mongoUri;
const dbName = 'examples';
const collectionName = 'Authors';

let connectedClient: MongoClient;
let collection: Collection;

const authors = [
    {name: 'Talking'},
    {name: 'Svevo'},
    {name: 'Richler'}
];

const setupObs = connectObs(uri)
.pipe(
    tap(client => {
        connectedClient = client;
        const db = client.db(dbName);
        collection = db.collection(collectionName);
    }),
    switchMap(() => dropObs(collection)),
    switchMap(() => {
        const db = connectedClient.db(dbName);
        return createCollectionObs(collectionName, db);
    }),
    switchMap(collection => insertManyObs(authors, collection))
);

// when the setup completes we start the logic
setupObs
.pipe(
    switchMap(() => findObs(collection)),
    map(author => author.name),
    mergeMap(author_searched => {
        const uri = `http://openlibrary.org/search.json?author=${author_searched}`;
        return httpGetRequestObs(uri)
        .pipe(
            map(dataFetched => ({author_searched, dataFetched}))
        )
    }),
    map(({author_searched, dataFetched}) => {
        const bookTitles = dataFetched.docs.map(doc => doc.title);
        const titles = bookTitles.length > 5 ? bookTitles.slice(0,5) : bookTitles;
        return {
            author_searched,
            author_found: dataFetched.author_name,
            titles
        }
    }),
)
.subscribe(
    data => console.log(JSON.stringify(data, null, 2)),
    console.error,
    () => {process.exit(0)}
)

