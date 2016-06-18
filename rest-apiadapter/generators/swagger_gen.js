"use strict";
/**
* Code-Generator which consumes a proto3-file and generates the according
* Swagger.io file.
* author: Tobias Freundorfer (https://github.com/tfreundo)
*/
var fs = require("fs");
var protobuf = require("protobufjs");
var util = require("util");

/**
* Project definitions
*/
var output = "./swagger.yaml";
var version = "1.0";
var title = "gRPC-API-Adapter (REST)";
var host = "localhost";
var port = process.env.REST_LISTEN_PORT;

/**
* Protobuf definitions
*/
var protoFile = process.env.API_PROTO_PATH;
var protoParser = new protobuf.DotProto.Parser(fs.readFileSync(protoFile));

// Check if it was called as required of as main
if(require.main === module){
  console.log("swagger_gen.js using environment variables:\n"
    + "REST_LISTEN_PORT = " + port + " | API_PROTO_PATH = " + protoFile);
  main();
}else{
  // Not allowed to require.
}

function main(){
  fs.writeFileSync(output, "swagger: \"2.0\"\n");
  var protoObj = protoParser.parse();
  appendDescription();
  appendPaths(protoObj);
  appendStaticDefinitions();
  appendDynamicDefinitions(protoObj.messages);
  appendEnumDefinitions(protoObj);
}


function appendDescription(){
  fs.appendFileSync(output, "info:\n");
  fs.appendFileSync(output, " version: \"" + version +"\"\n");
  fs.appendFileSync(output, " title: " + title + "\n");
  fs.appendFileSync(output, "host: " + host + ":" + port + "\n");
  fs.appendFileSync(output, "basePath: /\n");
  fs.appendFileSync(output, "schemes:\n \- http\n \- https\n");
  fs.appendFileSync(output, "consumes:\n - application/json\n");
  fs.appendFileSync(output, "produces:\n - application/json\n");
}

function appendPaths(protoObj){
  fs.appendFileSync(output, "paths:\n");
  appendStaticPaths();
  appendDynamicPaths(protoObj);
  fs.appendFileSync(output, " /swagger:\n");
  fs.appendFileSync(output, "  x-swagger-pipe: swagger_raw\n");
}

function appendStaticPaths(){
  // Get service requests path
  fs.appendFileSync(output, " /getServiceRequest:\n");
  fs.appendFileSync(output, "  x-swagger-router-controller: getSerReq\n");
  fs.appendFileSync(output, "  get:\n");
  fs.appendFileSync(output, "    parameters:\n");
  fs.appendFileSync(output, "     - name: id\n");
  fs.appendFileSync(output, "       in: query\n");
  fs.appendFileSync(output, "       description: The ServiceRequestId to query for.\n");
  fs.appendFileSync(output, "       type: string\n");
  fs.appendFileSync(output, "    description: Gets information for the specified ServiceRequestId.\n");
  fs.appendFileSync(output, "    operationId: getSerReq\n");
  fs.appendFileSync(output, "    produces:\n");
  fs.appendFileSync(output, "     - text/plain\n");
  fs.appendFileSync(output, "    responses:\n");
  fs.appendFileSync(output, "     200:\n");
  fs.appendFileSync(output, "      description: Success\n");
  fs.appendFileSync(output, "      schema:\n");
  fs.appendFileSync(output, "       title: ServiceRequest\n");
  fs.appendFileSync(output, "       type: string\n");
  fs.appendFileSync(output, "     default:\n");
  fs.appendFileSync(output, "      description: Error\n");
  fs.appendFileSync(output, "      schema:\n");
  fs.appendFileSync(output, "       $ref: \"#/definitions/ErrorResponse\"\n");
}

function appendDynamicPaths(protoObj){

  for(var i=0;i<protoObj.services.length;i++){
    for(var rpcName in protoObj.services[i].rpc){
      fs.appendFileSync(output, " /" + protoObj.services[i].name +
      "/" + rpcName + ":\n");
      fs.appendFileSync(output, "  x-swagger-router-controller: " +
      "gen_" + protoObj.services[i].name + "\n");

      fs.appendFileSync(output, "  post:\n");
      fs.appendFileSync(output, "   parameters:\n");
      var requestType = protoObj.services[i].rpc[rpcName].request;
      var swaggerRef = getSwaggerRefDefinition(requestType);
      fs.appendFileSync(output, "    - name: "+ requestType +"\n");
      fs.appendFileSync(output, "      in: body\n");
      fs.appendFileSync(output, "      required: true\n");
      fs.appendFileSync(output, "      schema:\n");
      fs.appendFileSync(output, "       " + swaggerRef + "\n");
      fs.appendFileSync(output, "   description: gRPC-Servive for "+ rpcName +"\n");
      fs.appendFileSync(output, "   operationId: "+ rpcName + "\n");
      fs.appendFileSync(output, "   consumes:\n");
      fs.appendFileSync(output, "    - application/json\n");
      fs.appendFileSync(output, "   produces:\n");
      fs.appendFileSync(output, "    - text/plain\n");
      fs.appendFileSync(output, "   responses:\n");
      fs.appendFileSync(output, "    200:\n");
      fs.appendFileSync(output, "     description: Success\n");
      fs.appendFileSync(output, "     schema:\n");
      fs.appendFileSync(output, "      title: " + rpcName + "RequestId\n");
      fs.appendFileSync(output, "      type: string\n");
      fs.appendFileSync(output, "    default:\n");
      fs.appendFileSync(output, "     description: Error\n");
      fs.appendFileSync(output, "     schema:\n");
      fs.appendFileSync(output, "      $ref: \"#/definitions/ErrorResponse\"\n");
    }
  }
}

function appendStaticDefinitions(){
  fs.appendFileSync(output, "definitions:\n");
  fs.appendFileSync(output, " ErrorResponse:\n");
  fs.appendFileSync(output, "  required:\n");
  fs.appendFileSync(output, "   - message\n");
  fs.appendFileSync(output, "  properties:\n");
  fs.appendFileSync(output, "   message:\n");
  fs.appendFileSync(output, "    type: string\n");
}

function appendDynamicDefinitions(messages){
  for(var i=0;i<messages.length;i++){
    var messageName = messages[i].name;

    if(messages[i].messages.length > 0 ){
      appendDynamicDefinitions(messages[i].messages);
    }

    fs.appendFileSync(output, " " + messageName + ":\n");
    fs.appendFileSync(output, "  properties:\n");
    // TODO: Currently missing: options, oneofs
    for(var j=0;j<messages[i].fields.length;j++){
      var rule = messages[i].fields[j].rule;
      var type = messages[i].fields[j].type;
      var fieldName = messages[i].fields[j].name;
      var options = messages[i].fields[j].options;
      var id = messages[i].fields[j].id;
      fs.appendFileSync(output, "   "+ fieldName +":\n");
      // Special case because maps are currently not supported by swagger
      if(rule == "map" || rule == "repeated"){
        appendMapArrayDefinition(type);
      }
      else if(isPrimitiveDataType(type)){
        fs.appendFileSync(output, "    type: "+ convertDataTypeProto3ToSwagger(type)
        +"\n");
      }
      else{
        fs.appendFileSync(output, "    "+ getSwaggerRefDefinition(type) +"\n");
      }
    }
  }
}

function appendEnumDefinitions(protoObj){

  for(var i=0;i<protoObj.enums.length;i++){

    var enumName = protoObj.enums[i].name;
    fs.appendFileSync(output, " " + enumName + ":\n");
    fs.appendFileSync(output, "  type: string\n");
    fs.appendFileSync(output, "  enum: [");
    for(var j=0;j<protoObj.enums[i].values.length;j++){
      var valueName = protoObj.enums[i].values[j].name;
      fs.appendFileSync(output, "\"" + valueName + "\"");

      if(j < protoObj.enums[i].values.length -1){
        fs.appendFileSync(output, ",");
      }
    }
    fs.appendFileSync(output, "]\n");
  }
}

function convertDataTypeProto3ToSwagger(protoType){
  if(protoType === "int32"){
    return "integer";
  }
  else if(protoType === "int64"){
    return "integer";
  }
  else if(protoType === "float"){
    return "number";
  }
  else if(protoType === "double"){
    return "number";
  }
  else if(protoType === "bytes"){
    return "string";
  }
  else if(protoType === "bool"){
    return "boolean";
  }
  else if(protoType === "Timestamp"){
    return "string";
  }
  else{
    return "string";
  }
}

function isPrimitiveDataType(protoType){
  if(protoType === "int32" || protoType === "int64" ||
  protoType === "float" || protoType === "double" ||
  protoType === "bytes" || protoType === "bool" ||
  protoType === "Timestamp" || protoType === "string"){
    return true;
  }
  return false;
}

function getSwaggerRefDefinition(dataType){
  return "$ref: \"#/definitions/" + dataType + "\"";
}

function appendMapArrayDefinition(type){
  fs.appendFileSync(output, "    type: array\n");
  fs.appendFileSync(output, "    items:\n");
  if(isPrimitiveDataType(type)){
    fs.appendFileSync(output, "     type: "+
      convertDataTypeProto3ToSwagger(type) + "\n");
  }
  else{
    fs.appendFileSync(output, "     " + getSwaggerRefDefinition(type) +"\n");
  }
}
