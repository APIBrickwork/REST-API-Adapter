"use strict";
var testCase = require("nodeunit").testCase;
var async = require("async");
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
    method: 'POST'
  };

  var request =
  {
    values_to_use: [3,4],
    type: protoDescriptor.CalculationEnum.MULTIPLICATION,
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


}
