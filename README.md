# gRPC-APIAdapter
A gRPC API-Adapter written in Node.js

## Default behaviour
* A swagger.yaml file will be generated using the given proto file defining Paths for each gRPC Service (resp. each RPC within a single gRPC Service (defaults back to POST method)
* Each gRPC Service defined in the proto file will result in a generated `gen_*.js` file
* Each RPC of each gRPC Service will result in a specific function within that `gen_*.js` file. Each function will called if the according Path is addressed (default POST).
* If a RPC uses a request stream two additional paths will be generated (GET --> opens Stream | POST --> Posts data to stream | DELETE --> Closes/deletes the stream)

## Future Work
* Allow usage of a metadata file which allows the user to specify which method for a given service should be used e.g. something like below (simple JSON or so)
```
{
  serviceName1: "POST",
  service2: "GET"
}
``` 
