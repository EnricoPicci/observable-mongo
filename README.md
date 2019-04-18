[![Build Status](https://travis-ci.org/EnricoPicci/observable-mongo.svg?branch=master)](https://travis-ci.org/EnricoPicci/observable-mongo)
[![Coverage Status](https://coveralls.io/repos/github/EnricoPicci/observable-mongo/badge.svg?branch=master)](https://coveralls.io/github/EnricoPicci/observable-mongo?branch=master)

# observable-mongo
Functions that provide some 'node mongodb driver APIs' as Observables. 

To run the tests it is required to have a working instance of Mongo to connect to.
There is a defualt instance on Mongo Atlas whose uri and credentials are defined in "config.ts" file in the "src" folder.

In case you want to run the tests on other mongo instances, change "config.ts" and run the command "npm run tsc" to rigenerate the "dist" directory with the configuration information

# examples
For use cases that see different asyncrhonous elements interacting, using the Observable pattern can simplify and clarify the code.

A simple use case can be the following:
 - you need to read from a Mongo collection a list of authors
 - for each author you need to query a REST API to fetch the titles on the author
 - than you need to write the titles in a file with the author name

In this case you need to interact with Mongo, http requests and the Node fs library, which all offer asynchrnous APIs.
If these APIs offer also an Observable version, that the code of the example can be written as a single stream, leading to a more readable code (personal opinion).

The example in the repo represents this use case using observable-http-request and observable-fs, which are companion libraries of observable-mongo.
