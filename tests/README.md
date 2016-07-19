# tests
Tests-Bundles for evaluating the API Adapter. 
Additionally `testapi` offers a gRPC API (which uses all proto3 and gRPC functionalities) that 
may be used for evaluation.

## [apibricks-testapis](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/apibricks-testapis)
This folder contains for each testapi (listed [here](https://github.com/jojow/cloudlabs/blob/master/part4/testing-apis.md)) the generated swagger specification as an `.html` file as well as a `.yaml` file.

You may either directly open the `.html` in your prefered browser or open the `.yaml` file in the [Swagger Editor](http://editor.swagger.io/#/) which is a bit prettier and more interactively.

## Test-Overview

__Possible states:__
* Outstanding: Not yet developed.
* Under dev: Is in development state.
* Finished: Development has finished and local execution worked. But not yet tested using a clean environment.
* Finalized: Final state. Also tested with a clean environment (fresh pull of repo, no preexisting docker images, no preexisting docker containers)

| Test-Bundle | Docker | Testscripts | Status | Execution-Info |
| ----------- | ------ | ----------- | ------ | ---- |
| (part3): Test gRPC API + REST API Adapter + test script | [docker-testapi](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/docker-testapi) | [testscripts-testapi](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/testscripts-testapi) | Finalized |See [Basic](#basic-execution) |
| (part3): gRPC API + REST API Adapter + test script to deploy WordPress | [docker-chefmate-rest](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/docker-chefmate-rest) | [testscripts-chefmate-rest](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/testscripts-chefmate-rest) | Finalized + demo |See [Extended-Dockerfile](#extended-execution-dockerfile-credentials) |
| (part4): Lambda gRPC API + REST API Adapter + test scripts | [docker-lambda-rest](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/docker-lambda-rest) | [testscripts-lambda-rest](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/tests/testscripts-lambda-rest) | Finalized |See [Extended-Configfile](#extended-execution-config-credentials) |

## Basic Execution
* Clone the repository
* Change directory to the subfolder stated in the column `Docker`
* Run `docker-compose up`

## Extended Execution Dockerfile Credentials
__Those tests use AWS!__

It is a special execution routine where the user (in order to make the tests work) has to enter the AWS credentials. 
* Clone the repository
* Change directory to the subfolder stated in the column `Docker`
* Open the Dockerfile `Dockerfile-chefmateserver`
* Insert your AWS credentials
* Save the file
* Run `docker-compose up`

## Extended Execution Config Credentials
__Those tests use AWS!__

It is a special execution routine where the user (in order to make the tests work) has to enter the AWS credentials. 
* Clone the repository
* Change directory to the subfolder stated in the column `Docker`
* Open the config.json file
* Insert your AWS credentials
* Insert or Modify the region
* Save the file
* Run `docker-compose up`

## Run the gRPC Testing API on your own
* Clone the repository
* Change directory to the subfolder `./docker-testapi`
* Run `docker build -t testgrpcserver:latest -f Dockerfile-testgrpcserver .` to build the image
* Run the container using `docker run -i testgrpcserver:latest`
