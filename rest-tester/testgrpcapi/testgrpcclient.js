"use strict";
var testCase = require("nodeunit").testCase;
var async = require("async");
var grpc = require("grpc");
const http = require("http");
var _ = require('lodash');
var protoDescriptor = grpc.load("./tester.proto");

var users = [{firstname: "Volde", lastname: "mort"},
  {firstname: "Heisen", lastname: "berg"}];

exports.sendNoStreamRequest = function(test){

  var httpOptions = {
    host: process.env.ADAPTER_HOST,
    port: process.env.ADAPTER_PORT,
    path: '/TesterService/NoStream',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var request =
  {
    values_to_use: [3,4],
    type: "MULTIPLICATION",
    info: {info: "teststring"}
  };

  console.log("Using request:\n" + JSON.stringify(request));

  var req = http.request(httpOptions, (res) => {
    res.setEncoding("utf8");
    res.on("data", (data) => {
      console.log("Data: \n" + data);
    });
    res.on("end", () =>{
      console.log("End: \n");
    });
  });

  req.on("error", (err) => {
    console.log("Error with request:\n" + err.message);
  });

  req.write(JSON.stringify(request));
  req.end();

  // TODO: Do some assertions
  test.done();
}
