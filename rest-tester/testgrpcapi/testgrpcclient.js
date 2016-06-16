var testCase = require("nodeunit").testCase;
var grpc = require("grpc");
var protoDescriptor = grpc.load("./tester.proto");

var grpcHost = "localhost";
var grpcPort = 8181;

var servicestub = new protoDescriptor.TesterService(grpcHost+":"+grpcPort,
  grpc.credentials.createInsecure());

exports.sendNoStreamRequest = function(test){

  var request =
  {
    values_to_use: [3,4],
    type: protoDescriptor.CalculationEnum.ADDITION,
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
          test.equals(key, "ADDITION", "Expected key ADDITION but was " + key);
          test.equals(value, 7, "Expected value 7 but was " + value);
          counter++;
        }
        test.equals(counter, 1, "Expected map size " + 1 + " but was " + counter);
      }

      test.done();
    });
}
