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
  fs.appendFileSync(output, " version: \"" + version +"\"\n");
  fs.appendFileSync(output, " title: " + title + "\n");
  fs.appendFileSync(output, "host: " + host + ":" + port + "\n");
  fs.appendFileSync(output, "basePath: /\n");
  fs.appendFileSync(output, "schemes:\n \- http\n \- https\n");
  fs.appendFileSync(output, "consumes:\n - application/json\n");
  fs.appendFileSync(output, "produces:\n - application/json\n");
}

function appendPaths(){
  fs.appendFileSync(output, "paths:\n");
  appendStaticPaths();
  appendDynamicPaths();
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

function appendDynamicPaths(){

  var protoObj = protoParser.parse();
  console.log(util.inspect(protoObj, false, null, true));
  for(var i=0;i<protoObj.services.length;i++){
    for(var rpcName in protoObj.services[i].rpc){
      fs.appendFileSync(output, " /" + protoObj.services[i].name +
      "/" + rpcName + ":\n");
      fs.appendFileSync(output, "  x-swagger-router-controller: " +
      protoObj.services[i].name + "\n");

      fs.appendFileSync(output, "  post:\n");
      fs.appendFileSync(output, "   parameters:\n");
      fs.appendFileSync(output, "    - name: "+ rpcName +"Request\n");
      fs.appendFileSync(output, "      in: body\n");
      fs.appendFileSync(output, "      required: true\n");
      fs.appendFileSync(output, "      schema:\n");
      fs.appendFileSync(output, "       type: object\n");
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
