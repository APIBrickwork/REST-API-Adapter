#!/bin/bash

echo "### Waiting for ${ADAPTER_HOST}:${ADAPTER_PORT} to get ready..."
while ! nc -vz ${ADAPTER_HOST} ${ADAPTER_PORT}
do
  echo "### Retry..."
  sleep 3;
done

echo "### Starting unit tests."
nodeunit testgrpcclient.js
