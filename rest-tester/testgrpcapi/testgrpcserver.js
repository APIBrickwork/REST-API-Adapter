var grpc = require("grpc");
var protoDescriptor = grpc.load("./tester.proto");

// TODO: Use environment variables
var host = "localhost";
var port = 8181;

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
  // TODO: Imple,enmt
  console.log("Received request for noStream with values:\n"
  + JSON.stringify(call.request));

  var values = call.request.values_to_use;

  if(call.request.type === "ADDITION"){
    var result = 0;
    for(var i=0;i<values.length;i++){
      result += parseInt(values[i]);
    }
    var response =
    {
      map: {"ADDITION": result}
    };
    console.log(response);
    callback(null, response);
  }
  else if(call.request.type === "MULTIPLICATION"){

  }
  else{
    console.log("Wrong type: " + call.request.type);
  }
}

function requestStream(request){
  // TODO: Implement
  var feature;

  console.log("Received request for requestStream with values:\n" + request);
}

function responseStream(request){
  // TODO: Implement
  var feature;

  console.log("Received request for responseStream with values:\n" + request);
}

function bidirectionalStream(request){
  // TODO: Implement
  var feature;

  console.log("Received request for bidirectionalStream with values:\n" + request);
}
