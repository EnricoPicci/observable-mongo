# observable-mongo
Functions that provide node mongods driver APIs as Observables

To run the tests it is required to have a working instance of Mongo to connect to.
Assuming there is such instance, create a "config.ts" file in the "src" folder to store the uri and credentials to access Mongo, along this example
export const config = {
    mongoUri: "mongodb+srv://user:password@cluster-uri",
}

In case you want to run the tests locally, after the "config.ts" file has been added, run the command "npm run tsc" to rigenerate the "dist" directory with the configuration information
