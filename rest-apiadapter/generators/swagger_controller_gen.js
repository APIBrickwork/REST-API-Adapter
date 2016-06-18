"use strict";
/**
* Code-Generator which consumes a proto3-file and generates the according
* Swagger.io controller implementation files.
* author: Tobias Freundorfer (https://github.com/tfreundo)
*/
var fs = require("fs");
var protobuf = require("protobufjs");
var util = require("util");

// Prefix that is used to indicate that the according file was generated.
var filePrefix = "gen_";
var output = "";

/**
* Protobuf definitions
*/
var protoFile = process.env.API_PROTO_PATH;
var protoParser = new protobuf.DotProto.Parser(fs.readFileSync(protoFile));

/**
* gRPC definitions
*/
var grpcHost = process.env.API_HOST;
var grpcPort = process.env.API_PORT;

// Check if it was called as required of as main
if(require.main === module){
  console.log("swagger_controller_gen.js using environment variables:\n"
    + "API_HOST = " + grpcHost + " | API_PORT = " + grpcPort
    + " | API_PROTO_PATH = " + protoFile);
  main();
}else{
  // Not allowed to require.
}

function main(){
  var protoObj = protoParser.parse();
  // Create one controller file per gRPC-Service and add all rpcs as functions
  // in that file
  for(var i=0;i<protoObj.services.length;i++){
    output = "./" + filePrefix + protoObj.services[i].name + ".js";
    console.log("Generating " + output);
    appendRequires();
    appendProtoVariables(protoObj);
    appendGrpcVariables(protoObj.services[i]);
    appendCurrentId();
    appendModuleExports(protoObj.services[i]);
    appendRpcFunctionImpl(protoObj.services[i]);
  }
}

function appendRequires(){
  fs.writeFileSync(output, "var async = require(\"async\");\n");
  fs.appendFileSync(output, "var grpc = require(\"grpc\");\n");
  fs.appendFileSync(output, "var low = require(\"lowdb\");\n");
  fs.appendFileSync(output, "var uuid = require(\"node-uuid\");\n");
  fs.appendFileSync(output, "const db = low('../rest-storage/serviceRequestsDb.json', { storage: require('lowdb/lib/file-async') });\n");
  fs.appendFileSync(output, "\n\n");
}

function appendProtoVariables(protoObj){
  fs.appendFileSync(output, "var protoFile = \""+ protoFile + "\";\n");
  // Append package to protoDescriptor if set
  var protoDescriptorString = "var protoDescriptor = grpc.load(protoFile)"
  if(!protoObj.package === null){
    protoDescriptorString += "." + protoObj.package;
  }
  protoDescriptorString += ";\n";
  fs.appendFileSync(output, protoDescriptorString);
  fs.appendFileSync(output, "\n\n");
}

function appendGrpcVariables(grpcService){

  fs.appendFileSync(output, "var grpcHost = \"" + grpcHost +"\";\n");
  fs.appendFileSync(output, "var grpcPort = " + grpcPort +";\n");

  // append stub for the service
  var grpcCredentialsString = "grpc.credentials.createInsecure()"
  fs.appendFileSync(output, "var " + grpcService.name + "stub = new protoDescriptor." +
  grpcService.name + "(grpcHost + \":\" + grpcPort," + grpcCredentialsString + ");\n");
  //var ec2opsstub = new protoDescriptor.Ec2Ops(grpcHost+":"+grpcPort,
  //grpc.credentials.createInsecure())
  fs.appendFileSync(output, "\n\n");
}

function appendCurrentId(){
  fs.appendFileSync(output, "// v1 --> time-based uuid\n");
  fs.appendFileSync(output, "var currentId = uuid.v1();\n");
  fs.appendFileSync(output, "\n\n");
}

function appendModuleExports(grpcService){
  // append an exports for each rpc
  fs.appendFileSync(output, "module.exports = {\n");

  // Compare the current prop index to the amount of props to determine whether
  // a comma for separation should be added or not
  var propsQty = Object.keys(grpcService.rpc).length;
  var currentPropIndex = 0;
  for(var rpcName in grpcService.rpc){
    fs.appendFileSync(output, "\t" + rpcName + ": " + rpcName);
    if(currentPropIndex < propsQty-1){
      fs.appendFileSync(output, ",\n");
    }
    else{
      fs.appendFileSync(output, "\n");
    }
    currentPropIndex++;
  }

  fs.appendFileSync(output, "};\n\n");
}

function appendRpcFunctionImpl(grpcService){
  for(var rpcName in grpcService.rpc){
    var usesRequestStream = false;
    var usesResponseStream = false;
    // TODO: Distinguish between no stream, client stream, server stream and both stream!!
    // TODO: Maybe implement that as soon as test environment is set up
    // TODO: Could be enough to implement without stream for the first local tests
    fs.appendFileSync(output, "function " + rpcName + "(req, res){\n");
      if(grpcService.rpc.hasOwnProperty(rpcName)){

        usesRequestStream = grpcService.rpc[rpcName].request_stream;
        usesResponseStream = grpcService.rpc[rpcName].response_stream;

        if(!usesRequestStream && !usesResponseStream){
          appendRpcFunctionImplNoStream(grpcService.name, rpcName, grpcService.rpc[rpcName]);
        }else if(usesRequestStream && !usesResponseStream){
          appendRpcFunctionImplRequestStream();
        }else if(!usesRequestStream && usesResponseStream){
          appendRpcFunctionImplResponseStream();
        }else{
          appendRpcFunctionImplBidirectionalStream();
        }
      }

    fs.appendFileSync(output, "}\n\n");
  }
}

function appendRpcFunctionImplNoStream(grpcServiceName, rpcName, rpcProps){
  fs.appendFileSync(output, "\t async.parallel([\n");
  fs.appendFileSync(output, "\t\t// function 1: call of gRPC service\n");
  fs.appendFileSync(output, "\t\tfunction(callback){\n");

  var requestBodyString = "req.swagger.params." + rpcProps.request + ".value";
  var lowerCaseRpcName = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);
  fs.appendFileSync(output, "\t\t\t" + grpcServiceName + "stub." +
  lowerCaseRpcName + "(" + requestBodyString + ",\n" + "\t\t\tfunction(err, feature){\n");
  fs.appendFileSync(output, "\t\t\t\tif(err){\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".status\", \"error\").value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".output\", err).value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tcallback(err);\n");
  // end of if
  fs.appendFileSync(output, "\t\t\t\t} else{\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".status\", \"success\").value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".output\", feature).value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tcallback();\n");
  // end of else
  fs.appendFileSync(output, "\t\t\t\t}\n");
  // end of err,feature function
  fs.appendFileSync(output, "\t\t\t});\n");
  // end of function1
  fs.appendFileSync(output, "\t\t},\n");
  fs.appendFileSync(output, "\t\t// function 2: return serviceRequestId for lookup\n");
  fs.appendFileSync(output, "\t\tfunction(callback){\n");

  fs.appendFileSync(output, "\t\t\tvar jsonRequest = {status:\"pending\", service:\"" + rpcName + "\", output:\"\"};\n");
  fs.appendFileSync(output, "\t\t\tdb.set(currentId, jsonRequest).value();\n");
  fs.appendFileSync(output, "\t\t\tcallback();\n");
  // end of function2
  fs.appendFileSync(output, "\t\t}],\n");
  fs.appendFileSync(output, "\t\t// callback function\n");
  fs.appendFileSync(output, "\t\tfunction(err){\n");
  fs.appendFileSync(output, "\t\t\tconsole.log(\"" + rpcName +
  "-Callbacks for ServiceRequestId \" + currentId + " + "\" finished.\"" + ");\n");
  // end of callback function
  fs.appendFileSync(output, "\t\t}\n");
  // end of async.parallel
  fs.appendFileSync(output, "\t );\n\n");
  fs.appendFileSync(output, "\tvar response = {serviceRequestId:currentId};\n");
  fs.appendFileSync(output, "\tres.end(\"serviceRequestId = \" + currentId);\n");
}

function appendRpcFunctionImplRequestStream(){
  // TODO: Implement
}

function appendRpcFunctionImplResponseStream(){
  // TODO: Implement
}

function appendRpcFunctionImplBidirectionalStream(){
  // TODO: Implement
}
