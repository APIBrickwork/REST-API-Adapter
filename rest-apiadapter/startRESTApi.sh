#!/bin/bash

# Absolute path to this script
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in
SCRIPTPATH=$(dirname "$SCRIPT")

swaggerYamlPath=/api/swagger
swaggerControllerPath=/api/controllers
generatorPath=/generators


echo "### Removing old *.yaml files from directory $SCRIPTPATH$swaggerYamlPath"
cd $SCRIPTPATH$swaggerYamlPath
rm -f *.yaml

echo "### Removing old *.yaml files from directory $SCRIPTPATH$generatorPath"
cd $SCRIPTPATH$generatorPath
rm -f *.yaml

echo "### Removing old gen_ files from directory $SCRIPTPATH$swaggerControllerPath"
cd $SCRIPTPATH$swaggerControllerPath
rm -f gen_*.js

echo "### Removing old gen_ files from directory $SCRIPTPATH$generatorPath"
cd $SCRIPTPATH$generatorPath
rm -f gen_*.js

echo "### Generating Swagger file using proto3-file as input."
cd $SCRIPTPATH$generatorPath
node swagger_gen.js

echo "### Copying Swagger file to directory $SCRIPTPATH$swaggerYamlPath"
cd $SCRIPTPATH$generatorPath
cp ./swagger.yaml $SCRIPTPATH$swaggerYamlPath

echo "### Generating Swagger Controller Implementations using proto3-file as input."
cd $SCRIPTPATH$generatorPath
node swagger_controller_gen.js

echo "### Copying Swagger Controller Implementation files to directory $SCRIPTPATH$swaggerControllerPath"
cd $SCRIPTPATH$generatorPath
cp ./gen_*.js $SCRIPTPATH$swaggerControllerPath

echo "### Waiting for ${ADAPTER_HOST}:${ADAPTER_PORT} to get ready..."
while ! nc -vz ${API_HOST} ${API_PORT}
do
  echo "### Retry..."
  sleep 3;
done

echo "### Starting Swagger Project."
cd $SCRIPTPATH
swagger project start
