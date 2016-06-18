"use strict";
var grpc = require("grpc");
var protoDescriptor = grpc.load("./tester.proto");

// TODO: Use environment variables
var host = "0.0.0.0";
var port = process.env.LISTEN_PORT;

var users = [];

// Check if it was called as required of as main
if(require.main === module){
  var grpcServer = getServer();
  grpcServer.bind(host + ":" + port, grpc.ServerCredentials.createInsecure());
  console.log("Starting Server listening on " + host + ":" + port);
  grpcServer.start();
}else{
  // Not allowed to require.
}

function getServer() {
  var server = new grpc.Server();
  server.addProtoService(protoDescriptor.TesterService.service, {
    noStream: noStream,
    requestStream: requestStream,
    responseStream: responseStream,
    bidirectionalStream: bidirectionalStream
  });
  return server;
}

function noStream(call, callback){

  console.log("Received request for noStream with values:\n"
  + JSON.stringify(call.request));

  var response = processCalculation(call.request);

  console.log("Sending response:\n" + JSON.stringify(response));
  callback(null, response);
}

function requestStream(call, callback){

  call.on("data", function(adduserreq){
    console.log("Received request for requestStream with values:\n"
    + JSON.stringify(adduserreq));

    users.push(adduserreq);
    console.log("current size = "  + users.length);
  });

  call.on("end", function(){
    var response = {
      qty: users.length
    }
    console.log("Sending response:\n" + JSON.stringify(response));
    callback(null, response);
  });
}

function responseStream(call){

  console.log("Received request for responseStream with values:\n" +
    JSON.stringify(call.request));

  var limit = call.request.limit;

  var valuesToReturn = 0;
  if(limit > users.length){
    valuesToReturn = users.length;
  }

  for(var i=0;i<valuesToReturn;i++){
    var response = {
      user: {firstname: users[i].firstname, lastname: users[i].lastname}
    };
    console.log("Sending response:\n" + JSON.stringify(response));
    call.write(response);
  }
  call.end();
}

function bidirectionalStream(call){

  console.log("Received request for bidirectionalStream with values:\n"
    + JSON.stringify(call.request));
  call.on("data", function(request){
    console.log("request = " + JSON.stringify(request));

    var response = {
      greeting: "Hello " + request.name
    };
    console.log("Sending response:\n" + JSON.stringify(response));
    call.write(response);
  });
  call.on("end", function(){
    call.end();
  })
}

function processCalculation(calcreq){
  var response;
  var values = calcreq.values_to_use;

  if(calcreq.type === "ADDITION"){
    var result = 0;
    for(var i=0;i<values.length;i++){
      result += parseInt(values[i]);
    }
    response =
    {
      map: {"ADDITION": result}
    };
  }
  else if(calcreq.type === "MULTIPLICATION"){
    var result = 1;
    for(var i=0;i<values.length;i++){
      result *= parseInt(values[i]);
    }
    response =
    {
      map: {"MULTIPLICATION": result}
    };
  }
  else{
    console.log("Wrong type: " + call.request.type);
  }
  return response;
}
