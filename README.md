# observable-mongo
Functions that provide 'node mongodb driver APIs' as Observables

To run the tests it is required to have a working instance of Mongo to connect to.
There is a defualt instance on Mongo Atlas whose uri and credentials are defined in "config.ts" file in the "src" folder.

In case you want to run the tests on other mongo instances, change "config.ts" and run the command "npm run tsc" to rigenerate the "dist" directory with the configuration information
