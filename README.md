[![Build Status](https://travis-ci.org/EnricoPicci/observable-mongo.svg?branch=master)](https://travis-ci.org/EnricoPicci/observable-mongo)
[![Coverage Status](https://coveralls.io/repos/github/EnricoPicci/observable-mongo/badge.svg?branch=master)](https://coveralls.io/github/EnricoPicci/observable-mongo?branch=master)

# observable-mongo
Functions that provide 'node mongodb driver APIs' as Observables

To run the tests it is required to have a working instance of Mongo to connect to.
There is a defualt instance on Mongo Atlas whose uri and credentials are defined in "config.ts" file in the "src" folder.

In case you want to run the tests on other mongo instances, change "config.ts" and run the command "npm run tsc" to rigenerate the "dist" directory with the configuration information
