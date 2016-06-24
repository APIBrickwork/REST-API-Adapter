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
    appendLocalVariables();
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

function appendLocalVariables(){
  fs.appendFileSync(output, "var streamMap = new Map();\n");
  fs.appendFileSync(output, "var streamIdToServiceRequestMap = new Map();\n");
  fs.appendFileSync(output, "\n\n");
}

function appendRpcFunctionImpl(grpcService){
  for(var rpcName in grpcService.rpc){
    var usesRequestStream = false;
    var usesResponseStream = false;

    fs.appendFileSync(output, "exports." + rpcName + " = function(req, res){\n");
      if(grpcService.rpc.hasOwnProperty(rpcName)){

        usesRequestStream = grpcService.rpc[rpcName].request_stream;
        usesResponseStream = grpcService.rpc[rpcName].response_stream;

        if(!usesRequestStream && !usesResponseStream){
          appendRpcFunctionImplNoStream(grpcService.name, rpcName, grpcService.rpc[rpcName]);
        }else if(usesRequestStream && !usesResponseStream){
          appendRpcFunctionImplRequestStream(grpcService.rpc[rpcName]);
        }else if(!usesRequestStream && usesResponseStream){
          appendRpcFunctionImplResponseStream(grpcService.name, rpcName, grpcService.rpc[rpcName]);
        }else{
          appendRpcFunctionImplBidirectionalStream(grpcService.rpc[rpcName]);
        }
      }

    fs.appendFileSync(output, "}\n\n");

    // TODO: Evalutate
    if(usesRequestStream){
      appendOpenStreamFunction(grpcService.name, rpcName, usesResponseStream);
      appendCloseStreamFunction(rpcName);
    }
  }
}

function appendRpcFunctionImplNoStream(grpcServiceName, rpcName, rpcProps){
  fs.appendFileSync(output, "\t// v4 --> random based uuid\n");
  fs.appendFileSync(output, "\tvar currentId = uuid.v4();\n");
  fs.appendFileSync(output, "\tasync.parallel([\n");
  fs.appendFileSync(output, "\t\t// function 1: call of gRPC service\n");
  fs.appendFileSync(output, "\t\tfunction(callback){\n");

  var requestBodyString = "req.swagger.params." + rpcProps.request + ".value";
  var lowerCaseRpcName = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);
  fs.appendFileSync(output, "\t\t\t" + grpcServiceName + "stub." +
  lowerCaseRpcName + "(" + requestBodyString + ",\n" + "\t\t\tfunction(err, res){\n");
  fs.appendFileSync(output, "\t\t\t\tif(err){\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".status\", \"error\").value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".output\", err).value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tcallback(err);\n");
  // end of if
  fs.appendFileSync(output, "\t\t\t\t} else{\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".status\", \"success\").value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tdb.set(currentId + \".output\", res).value();\n");
  fs.appendFileSync(output, "\t\t\t\t\tcallback();\n");
  // end of else
  fs.appendFileSync(output, "\t\t\t\t}\n");
  // end of err,res function
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
  fs.appendFileSync(output, "\tvar jsonRes = {requestId: currentId, streamId: \"\"}\n");
	fs.appendFileSync(output, "\tres.json(jsonRes);\n");
}

// TODO: Add logging for the below stuff
function appendRpcFunctionImplRequestStream(rpcProps){
  // TODO: Evaluate
  // TODO: Necessary to catch if call is not available???
  // TODO: All the streaming function should just return success or error
  // message
  fs.appendFileSync(output, "\tvar streamId = req.swagger.params.id.value;\n");
  var requestBodyString = "req.swagger.params." + rpcProps.request + ".value";
  fs.appendFileSync(output, "\tvar call = streamMap.get(streamId);\n");
  fs.appendFileSync(output, "\tconsole.log(\"streamId = \" + streamId + \" | body = \" + JSON.stringify(" + requestBodyString + "));\n");

  fs.appendFileSync(output, "\tcall.write("+ requestBodyString + ");\n");
  fs.appendFileSync(output, "\tvar currentId = streamIdToServiceRequestMap.get(streamId);\n");
  fs.appendFileSync(output, "\tvar jsonRes = {requestId: currentId, streamId: streamId}\n");
	fs.appendFileSync(output, "\tres.json(jsonRes);\n");

}

function appendRpcFunctionImplResponseStream(grpcServiceName, rpcName, rpcProps){
  // TODO: Implement
  var lowerCaseRpcName = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);
  var requestBodyString = "req.swagger.params." + rpcProps.request + ".value";
  fs.appendFileSync(output, "\t// v4 --> random based uuid\n");
  fs.appendFileSync(output, "\tvar currentId = uuid.v4();\n");
  fs.appendFileSync(output, "\tvar call = "+ grpcServiceName + "stub." +
    lowerCaseRpcName + "("+ requestBodyString + ");\n");
  //fs.appendFileSync(output, "\tvar dataCounter = 0;\n\n");
  fs.appendFileSync(output, "\tvar jsonRequest = {status:\"pending\", service:\"" +
    rpcName + "\", output:\"\"};\n");
  fs.appendFileSync(output, "\tdb.set(currentId, jsonRequest).value();\n\n");

  fs.appendFileSync(output, "\tcall.on(\"data\", function(data){\n");

  fs.appendFileSync(output, "\t\tdb.set(currentId + \".status\", \"pending\").value();\n");
  // TODO: Think about how to append multiple outputs!!
  //fs.appendFileSync(output, "\t\tvar appendedData = db.get(currentId);\n");
  //fs.appendFileSync(output, "\t\tappendedData.output[\"data\" + dataCounter] = data;\n");
  fs.appendFileSync(output, "\t\tdb.push(currentId + \".output\", data).value();\n");
  //fs.appendFileSync(output, "\t\tdataCounter++;\n");
  // end of call.on data
  fs.appendFileSync(output, "\t});\n");

  fs.appendFileSync(output, "\tcall.on(\"status\", function(status){\n");
  fs.appendFileSync(output, "\t\tconsole.log(\"Status: \" + JSON.stringify(status));\n");
  // end of call.on status
  fs.appendFileSync(output, "\t});\n");

  fs.appendFileSync(output, "\tcall.on(\"end\", function(){\n");
  fs.appendFileSync(output, "\t\tdb.set(currentId + \".status\", \"success\").value();\n");
  fs.appendFileSync(output, "\t\tdataCounter = 0;\n");
  // end of call.on end
  fs.appendFileSync(output, "\t});\n");
  fs.appendFileSync(output, "\tvar jsonRes = {requestId: currentId, streamId: \"\"}\n");
	fs.appendFileSync(output, "\tres.json(jsonRes);\n");
}

function appendRpcFunctionImplBidirectionalStream(rpcProps){
  // TODO: Evaluate
  // TODO: Necessary to catch if call is not available???
  // TODO: All the streaming function should just return success or error
  // message
  fs.appendFileSync(output, "\tvar streamId = req.swagger.params.id.value;\n");

  var requestBodyString = "req.swagger.params." + rpcProps.request + ".value";
  fs.appendFileSync(output, "\tvar call = streamMap.get(streamId);\n");

  fs.appendFileSync(output, "\tcall.write("+ requestBodyString + ");\n");
  fs.appendFileSync(output, "\tvar currentId = streamIdToServiceRequestMap.get(streamId);\n");
  fs.appendFileSync(output, "\tvar jsonRes = {requestId: currentId, streamId: streamId}\n");
  fs.appendFileSync(output, "\tres.json(jsonRes);\n");
}

function appendOpenStreamFunction(grpcServiceName, rpcName, usesResponseStream){
  // TODO: Evaluate
  fs.appendFileSync(output, "exports." + rpcName + "OpenStream = function(req, res){\n");

  fs.appendFileSync(output, "\t// v4 --> random based uuid\n");
  fs.appendFileSync(output, "\tvar currentId = uuid.v4();\n");
  fs.appendFileSync(output, "\tvar streamId = uuid.v4();\n\n");

  fs.appendFileSync(output, "\tconsole.log(\"Created new Ids serviceRequestId = \" + currentId + \" | streamId = \" + streamId)\n\n");

  // In this case it's a bidirectional stream
  var lowerCaseRpcName = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);

  if(usesResponseStream){
    fs.appendFileSync(output, "\tvar call = "+ grpcServiceName + "stub." +
      lowerCaseRpcName + "();\n\n");
    fs.appendFileSync(output, "\tcall.on(\"data\", function(data){\n");

    fs.appendFileSync(output, "\t\tdb.set(currentId + \".status\", \"pending\").value();\n");
    // TODO: Think about how to append multiple outputs!!
    fs.appendFileSync(output, "\t\tdb.set(currentId + \".output\", data).value();\n");
    // end of call.on data
    fs.appendFileSync(output, "\t});\n");
    fs.appendFileSync(output, "\tcall.on(\"status\", function(status){\n");
    fs.appendFileSync(output, "\t\tconsole.log(\"Status: \" + JSON.stringify(status));\n");
    // end of call.on status
    fs.appendFileSync(output, "\t});\n");
    fs.appendFileSync(output, "\tcall.on(\"end\", function(){\n");
    fs.appendFileSync(output, "\t\tdb.set(currentId + \".status\", \"success\").value();\n");
    // end of call.on end
    fs.appendFileSync(output, "\t});\n");
  }
  else{
    fs.appendFileSync(output, "\tvar call = "+ grpcServiceName + "stub." +
      lowerCaseRpcName + "(function(err, res){\n");

      fs.appendFileSync(output, "\t\tif(err){\n");
      fs.appendFileSync(output, "\t\t\tdb.set(currentId + \".status\", \"error\").value();\n");
      fs.appendFileSync(output, "\t\t\tdb.set(currentId + \".output\", err).value();\n");
      // end of if
      fs.appendFileSync(output, "\t\t} else{\n");
      fs.appendFileSync(output, "\t\t\tdb.set(currentId + \".status\", \"success\").value();\n");
      fs.appendFileSync(output, "\t\t\tdb.set(currentId + \".output\", res).value();\n");
      // end of else
      fs.appendFileSync(output, "\t\t}\n" + "\t\t}\n" + "\t);\n\n");
  }

  fs.appendFileSync(output, "\tvar jsonRequest = {status:\"pending\", service:\"" +
    rpcName + "\", output:\"\"};\n");
  fs.appendFileSync(output, "\tdb.set(currentId, jsonRequest).value();\n\n");

  // Add stream to map
  fs.appendFileSync(output, "\tstreamMap.set(streamId, call);\n");

  fs.appendFileSync(output, "\tstreamIdToServiceRequestMap.set(streamId, currentId);\n");

  fs.appendFileSync(output, "\tvar jsonRes = {requestId: currentId, streamId: streamId}\n");
	fs.appendFileSync(output, "\tres.json(jsonRes);\n");

  fs.appendFileSync(output, "}\n\n");
}

function appendCloseStreamFunction(rpcName){
  // TODO: Evaluate
  fs.appendFileSync(output, "exports." + rpcName + "CloseStream = function(req, res){\n");
  fs.appendFileSync(output, "\tvar streamId = req.swagger.params.id.value;\n");
  fs.appendFileSync(output, "\tvar call = streamMap.get(streamId);\n");
  fs.appendFileSync(output, "\tcall.end();\n");
  fs.appendFileSync(output, "\tstreamMap.delete(streamId);\n");
  fs.appendFileSync(output, "\tstreamIdToServiceRequestMap.delete(streamId);\n");
  fs.appendFileSync(output, "\tres.end(\"Success\");\n");
  fs.appendFileSync(output, "}\n\n");
}
