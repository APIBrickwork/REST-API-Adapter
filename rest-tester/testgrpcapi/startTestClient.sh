#!/bin/bash

echo "### Waiting for gRPC Server to get ready..."
while ! nc -z ${ADAPTER_HOST} ${ADAPTER_PORT}; do sleep 3; done

echo "### Starting unit tests."
nodeunit testgrpcclient.js
