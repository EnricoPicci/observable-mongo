"use strict";
// Some authors names are stored in the 'Authors' Mongo collection
// You want to read 'Authors' and, for each author, fetch the titles of her/his books
// from a remote rest service (we use openlibrary project in this example) 
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("../observable-mongo");
const observable_http_request_1 = require("observable-http-request");
const config_1 = require("../config");
// setup - load the authors in the collection
const uri = config_1.config.mongoUri;
const dbName = 'examples';
const collectionName = 'Authors';
let connectedClient;
let collection;
const authors = [
    { name: 'Talking' },
    { name: 'Svevo' },
    { name: 'Richler' }
];
const setupObs = observable_mongo_1.connectObs(uri)
    .pipe(operators_1.tap(client => {
    connectedClient = client;
    const db = client.db(dbName);
    collection = db.collection(collectionName);
}), operators_1.switchMap(() => observable_mongo_1.dropObs(collection)), operators_1.switchMap(() => {
    const db = connectedClient.db(dbName);
    return observable_mongo_1.createCollectionObs(collectionName, db);
}), operators_1.switchMap(collection => observable_mongo_1.insertManyObs(authors, collection)));
setupObs
    .pipe(operators_1.switchMap(() => observable_mongo_1.findObs(collection)), operators_1.mergeMap(author => {
    const uri = `http://openlibrary.org/search.json?author=${author.name}`;
    return observable_http_request_1.httpGetRequestObs(uri).pipe(operators_1.map(dataFetched => ({ author, dataFetched })));
}), operators_1.map(({ author, dataFetched }) => ({ author, author_found: dataFetched.author_name, titles: dataFetched.docs.map(doc => doc.title) })))
    .subscribe(data => console.log(JSON.stringify(data, null, 2)), console.error, () => { process.exit(0); });
// import {httpGetRequestObs} from 'observable-http-request';
// import { from } from 'rxjs';
// import { mergeMap } from 'rxjs/operators';
// import {observable} from 'rxjs/internal/symbol/observable';
// const oo = observable;
// console.log(oo);
// const ss = Symbol.observable;
// console.log('s', ss);
// from(['Talking', 'Svevo', 'Richler'])
// .pipe(
//     mergeMap(name => {
//         const ret = httpGetRequestObs(`http://openlibrary.org/search.json?author=${name}`);
//         const os = ret[oo];
//         console.log(os);
//         return ret;
//     })
// )
// .subscribe(
//     console.log,
//     console.error
// )
//# sourceMappingURL=books-from-author.js.map