var fs = require("fs");
var protobuf = require("protobufjs");
var util = require("util");

/**
* Project definitions
*/
// TODO: Update after evaluation phase
var output = "./demoswagger.yaml";
var version = "1.0";
var title = "gRPC-API-Adapter (REST)";
var host = "localhost"
var port = 10010;

/**
* Protobuf definitions
*/
var protoFile = "../main.proto";
var protoParser = new protobuf.DotProto.Parser(fs.readFileSync(protoFile));
var grpcServiceNames = [];
var grpcRpcs = [];

// Check if it was called as required of as main
if(require.main === module){
  main();
}else{
  // Not allowed to require.
}

function main(){
  fs.writeFileSync(output, "swagger: \"2.0\"\n");
  appendDescription();
  appendPaths();
  appendStaticDefinitions();
}


function appendDescription(){
  fs.appendFileSync(output, "info:\n");
  // TODO: Weird bug that I simply cannot write string version on output
  fs.appendFileSync(output, "\tversion: \"" + version +"\"\n");
  fs.appendFileSync(output, "\ttitle: " + title + "\n");
  fs.appendFileSync(output, "host: " + host + ":" + port + "\n");
  fs.appendFileSync(output, "basePath: /\n");
  fs.appendFileSync(output, "schemes:\n\t\- http\n\t\- https\n");
  fs.appendFileSync(output, "consumes:\n\t- application/json\n");
  fs.appendFileSync(output, "produces:\n\t- application/json\n");
}

function appendPaths(){
  fs.appendFileSync(output, "paths:\n");
  appendStaticPaths();
  appendDynamicPaths();
  fs.appendFileSync(output, "\t/swagger:\n");
  fs.appendFileSync(output, "\t\t/x-swagger-pipe: swagger_raw\n");
}

function appendStaticPaths(){
  // Get service requests path
  fs.appendFileSync(output, "\t/getServiceRequest:\n");
  fs.appendFileSync(output, "\t\tx-swagger-router-controller: getSerReq\n");
  fs.appendFileSync(output, "\t\t\tget:\n");
  fs.appendFileSync(output, "\t\t\t\tparameters:\n");
  fs.appendFileSync(output, "\t\t\t\t\t- name: id\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tin: query\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tdescription: The ServiceRequestId to query for.\n");
  fs.appendFileSync(output, "\t\t\t\t\t\ttype: string\n");
  fs.appendFileSync(output, "\t\t\t\tdescription: Gets information for the specified ServiceRequestId.\n");
  fs.appendFileSync(output, "\t\t\t\toperationId: getSerReq\n");
  fs.appendFileSync(output, "\t\t\t\tproduces:\n");
  fs.appendFileSync(output, "\t\t\t\t\t- text/plain\n");
  fs.appendFileSync(output, "\t\t\t\tresponses:\n");
  fs.appendFileSync(output, "\t\t\t\t\t200:\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tdescription: Success\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tschema:\n");
  fs.appendFileSync(output, "\t\t\t\t\t\t\ttitle: ServiceRequest\n");
  fs.appendFileSync(output, "\t\t\t\t\t\t\ttype: string\n");
  fs.appendFileSync(output, "\t\t\t\t\tdefault:\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tdescription: Error\n");
  fs.appendFileSync(output, "\t\t\t\t\t\tschema:\n");
  fs.appendFileSync(output, "\t\t\t\t\t\t\t$ref: \"#/definitions/ErrorResponse\"\n");
}

function appendDynamicPaths(){

  var protoObj = protoParser.parse();
  console.log(util.inspect(protoObj, false, null, true));
  for(var i=0;i<protoObj.services.length;i++){
    for(var rpcName in protoObj.services[i].rpc){
      fs.appendFileSync(output, "\t/" + protoObj.services[i].name +
      "/" + rpcName + ":\n");
      fs.appendFileSync(output, "\t\tx-swagger-router-controller: " +
      protoObj.services[i].name + "\n");

      fs.appendFileSync(output, "\t\tpost:\n");
      fs.appendFileSync(output, "\t\t\tparameters:\n");
      fs.appendFileSync(output, "\t\t\t\t- name: "+ rpcName +"Request\n");
      fs.appendFileSync(output, "\t\t\t\t\tin: body\n");
      fs.appendFileSync(output, "\t\t\t\t\trequired: true\n");
      fs.appendFileSync(output, "\t\t\t\t\tschema:\n");
      fs.appendFileSync(output, "\t\t\t\t\t\ttype: object\n");
      fs.appendFileSync(output, "\t\t\tdescription: gRPC-Servive for "+ rpcName +"\n");
      fs.appendFileSync(output, "\t\t\toperationId: "+ rpcName + "\n");
      fs.appendFileSync(output, "\t\t\tconsumes:\n");
      fs.appendFileSync(output, "\t\t\t\t- application/json\n");
      fs.appendFileSync(output, "\t\t\tproduces:\n");
      fs.appendFileSync(output, "\t\t\t\t- text/plain\n");
      fs.appendFileSync(output, "\t\t\tresponses:\n");
      fs.appendFileSync(output, "\t\t\t\t200:\n");
      fs.appendFileSync(output, "\t\t\t\t\tdescription: Success\n");
      fs.appendFileSync(output, "\t\t\t\t\tschema:\n");
      fs.appendFileSync(output, "\t\t\t\t\t\ttitle: " + rpcName + "RequestId\n");
      fs.appendFileSync(output, "\t\t\t\t\t\ttype: string\n");
      fs.appendFileSync(output, "\t\t\t\t\tdefault:\n");
      fs.appendFileSync(output, "\t\t\t\t\t\tdescription: Error\n");
      fs.appendFileSync(output, "\t\t\t\t\t\tschema:\n");
      fs.appendFileSync(output, "\t\t\t\t\t\t\t$ref: \"#/definitions/ErrorResponse\"\n");
    }
  }
}

function appendStaticDefinitions(){
  fs.appendFileSync(output, "definitions:\n");
  fs.appendFileSync(output, "\tErrorResponse:\n");
  fs.appendFileSync(output, "\t\trequired:\n");
  fs.appendFileSync(output, "\t\t\t- message:\n");
  fs.appendFileSync(output, "\t\tproperties:\n");
  fs.appendFileSync(output, "\t\t\tmessage:\n");
  fs.appendFileSync(output, "\t\t\t\ttype: string\n");
}
