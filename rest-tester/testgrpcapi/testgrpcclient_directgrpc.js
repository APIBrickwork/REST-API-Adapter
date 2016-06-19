"use strict";
var testCase = require("nodeunit").testCase;
var grpc = require("grpc");
var async = require("async");
var _ = require('lodash');
var protoDescriptor = grpc.load("./tester.proto");

var grpcHost = process.env.ADAPTER_HOST;
var grpcPort = process.env.ADAPTER_PORT;

// TODO: Later has to call the REST-ADAPTER!!
// TODO: Therefore it may need some restructuring

var servicestub = new protoDescriptor.TesterService(grpcHost+":"+grpcPort,
  grpc.credentials.createInsecure());

var users = [{firstname: "Volde", lastname: "mort"},
  {firstname: "Heisen", lastname: "berg"}];

exports.sendNoStreamRequest = function(test){

  var request =
  {
    values_to_use: [3,4],
    type: protoDescriptor.CalculationEnum.MULTIPLICATION,
    info: {info: "teststring"}
  };

  console.log("Using request:\n" + JSON.stringify(request));

  servicestub.noStream(request,
    function(err, response){
      if(err){
        test.ok(false, "Error when calling noStream: " + err);
      }
      else{
        var counter = 0;
        console.log("Received response:\n" + JSON.stringify(response));
        for(var key in response.map){
          var value = response.map[key];
          if(request.type == protoDescriptor.CalculationEnum.ADDITION){
            test.equals(value, 7, "Expected value 7 but was " + value);
          }
          else if(request.type == protoDescriptor.CalculationEnum.MULTIPLICATION){
            test.equals(value, 12, "Expected value 12 but was " + value);
          }
          counter++;
        }
        test.equals(counter, 1, "Expected map size " + 1 + " but was " + counter);
      }

      test.done();
    });
}

exports.sendRequestStreamRequest = function(test){
  var call = servicestub.requestStream(function(err, resp){
    if(err){
      callback(err);
    }
    console.log("Received response:\n" + JSON.stringify(resp));
    test.equals(resp.qty, 2, "Expected size 2 but was " + resp.qty);
    test.done();
  });

  var userIndex = 0;
  function formRequest(){
    return function(callback){
      console.log("Sending request: \n" + JSON.stringify(users[userIndex]));
      call.write(users[userIndex]);
      userIndex++;
      _.delay(callback, _.random(500, 1500));
    }
  }

  var numRequests = 2;
  var requests = [];
  for(var i=0;i<numRequests;i++){
    requests[i] = formRequest();
  }
  async.series(requests, function(){
    console.log("Calling end");
    call.end();
  });

}

exports.sendResponseStreamRequest = function(test){
  var request = {
    limit: 100
  };

  var call = servicestub.responseStream(request);
  var respondedUsers = [];

  call.on("data", function(user){
    console.log("Received data:\n" + JSON.stringify(user));
    respondedUsers.push(user);
  });
  call.on("end", function(){
    test.equals(respondedUsers.length, users.length, "Expected user length " +
      users.length + " but was " + respondedUsers.length);
    test.done();
  });
  call.on("status", function(status){
    console.log("Status: " + JSON.stringify(status));
  });
}

exports.sendBidirectionalStreamRequest = function(test){
  var names = [{name: "Heisenberg"}, {name: "Voldemort"}];
  var respondedGreetings = [];

  var call = servicestub.bidirectionalStream();

  call.on("data", function(greeting){
    console.log("Received data:\n" + JSON.stringify(greeting));
    respondedGreetings.push(greeting);
  });
  call.on("end", function(){
    test.equals(respondedGreetings.length, names.length, "Expected user length " +
      names.length + " but was " + respondedGreetings.length);
    test.done();
  });

  for(var i=0;i<names.length;i++){
    console.log("Sending request:\n" + JSON.stringify(names[i]));
    call.write(names[i]);
  }
  call.end();
}
