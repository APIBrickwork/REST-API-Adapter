# gRPC-APIAdapter
This project is an approach to generically generate a REST-API Adapter for a gRPC Server just using the proto3 file as input in combination with [Swagger.io](http://swagger.io/).
It uses a given proto3 file to generate an according swagger.yaml file and the controllers used when calling the specified path.

## How it works

![REST-APIAdapter Start-Sequence](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/diagrams/REST-APIAdapter_Start_ActivityDiag.png)

### [swagger_gen.js](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/rest-apiadapter/generators/swagger_gen.js)
* Reads the proto3 file and optionally the metadata.json file
* Generates a swagger.yaml definition file using this information
* Offers two static paths:
 * GET `/help`: Shows a HTML representation of the `swagger.yaml` file that was generated. Shows [oops.html](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/rest-apiadapter/html/oops.html) if something went wrong while generating the inline-html file. Uses the controller [helppage.js](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/rest-apiadapter/api/controllers/helppage.js)
 * GET `/service-request/{id}`: Returns information about the service request with the specified ID in path. Uses the controller [getSerReq.js](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/rest-apiadapter/api/controllers/getSerReq.js)
* Generates dynamic paths:
 *  Each gRPC service defined in the proto3 file will result in a path with the following pattern `/<grpcName>/<rpcName>`. Where `<grpcName>` is the name of the gRPC Service defined and `<rpcName>` is the name of a RPC defined.
 * Those paths use POST (resp. see [Services using request streams](#services-using-request-streams))
* Each proto3 message (including enums etc.) will be converted to swagger definitions and dynamically referenced if used in gRPC services.
* Each path is linked to the specific controller resp. the according function within the specific controller 
* See [Services using request streams](#services-using-request-streams) for the special case when using request streams in gRPC Services

### [swagger_controller_gen.js](https://github.com/APIBrickwork/REST-API-Adapter/blob/master/rest-apiadapter/generators/swagger_controller_gen.js)
* Reads the proto3 file
* Each gRPC Service defined in the proto3 file will result in a generated controller [here](https://github.com/APIBrickwork/REST-API-Adapter/tree/master/rest-apiadapter/api/controllers) with the naming pattern `gen_<grpcName>.js` where `<grpcName>` is the name of the gRPC Service defined
* Each RPC of each gRPC Service will result in a generated function within the according `gen_<grpcName>.js` file. Those functions are automatically referenced by the `swagger_gen.js`
* See [Services using request streams](#services-using-request-streams) for the special case when using request streams in gRPC Services

### Services using request streams
If a gRPC Service defined in the specific proto3 file use request-streams (this is true for either just request streaming or bi-directional streaming) `swagger_gen.js` and `swagger_controller_gen.js` will generate additional functions to enable that functionality.

A request stream will result in 3 methods (instead of just one POST method):
* POST `/<grpcName>/<rpcName>`: Creates a service request and opens the stream. Will return the requestId that has to be used for streaming
* POST `/<grpcName>/<rpcName>/{id}`: Streams the object given in body to the stream of the given requestId `{id}` in path
* DELETE `/<grpcName>/<rpcName>/{id}`: Closes the stream and therefore indicates the end of streaming

`swagger_controller_gen.js` will generate the according functions to implement this. Those functions will automatically be referenced by the generated `swagger.yaml` file.

## (optional) metadata.json
This file is optional and can be used to customize the generated `swagger.yaml` file. 

The path to this file is per default `/api/metadata.json` but may be specified by chaning the environmental variable `METADATA_PATH`. If no file is available default values will be used.

Example:

```
{
  title: "My custom swagger.yaml title.",
  version: "1.8.3"
}
``` 

## Future work
Extensions for `metadata.json`:
* Metadata could be extended to allow the user to specify services and their according method (GET,POST,...) to use, instead of defaulting to POST
* Problem:
 * It then doesn't end with just editing the Method
 * It will be neccessary to enlarge the degrees of freedom the user has. This would include specifying definitions (like parameters in query, path, body,...), as well as descriptions,...
 * At some point you would end up by allowing the user to pretty much describe the things he would normally write directly to the swagger.yaml file in the metadata file
* Considering this the decision in this project was to __not__ offer the user this functionality
* Rather should the user modify the generated swagger.yaml file directly if necessary
