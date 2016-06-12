// Used to handle tasks in parralel
// async.parallel([func1, func2,...], callbackFunction);
var async = require("async");
var grpc = require("grpc");
var low = require("lowdb");
const db = low('../rest-storage/serviceRequestsDb.json', { storage: require('lowdb/lib/file-async') });
var uuid = require("node-uuid");

/**
* Protobuf
*/
var protoFile = "./main.proto";
// TODO: Dynamically add package on file generation if existing in proto file
var protoDescriptor = grpc.load(protoFile);

/**
* Stubs
*/
// TODO: Get this automatically
var grpcHost = "172.17.0.2";
var grpcPort = 8080;
// TODO: See http://www.grpc.io/docs/guides/auth.html for secure approaches
var ec2opsstub = new protoDescriptor.Ec2Ops(grpcHost+":"+grpcPort,
grpc.credentials.createInsecure());

// v1 --> time-based uuid
var currentId = uuid.v1();

module.exports = {
  createVm: createVm
};

function createVm(req, res){

  async.parallel([
    // call service on gRPC-Server
    function(callback){
      console.log(req.swagger.params.createVmRequest.value);
      ec2opsstub.createVm(req.swagger.params.createVmRequest.value, function(err, feature){
        if(err){
          db.set(currentId + ".status", "error").value();
          db.set(currentId + ".output", err).value();
          callback(err);
        }
        else{
          db.set(currentId + ".status", "success").value();
          db.set(currentId + ".output", feature).value();
          callback();
        }
      });
    },
    // Return serviceRequests id for lookup
    function(callback){
      var jsonRequest = {status:"pending", service:"createVm",
       output:""};
      db.set(currentId, jsonRequest).value();
      callback();
    }
  ],
    // callback function
    function(err){
      console.log("CreateVm-Callbacks for id " + currentId + " finished.");
    });

    var response = {serviceRequestId:currentId};
    res.end("serviceRequestId = " + currentId);

  }
