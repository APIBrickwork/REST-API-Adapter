"use strict";
var testCase = require("nodeunit").testCase;
var async = require("async");
var grpc = require("grpc");
const http = require("http");
var _ = require('lodash');
var protoDescriptor = grpc.load("./tester.proto");

var restHost = process.env.ADAPTER_HOST;
var restPort = process.env.ADAPTER_PORT;

/**
 * Test expected result section
 */
var successString = "success";

/**
 * Response messages section
 */
var requestId = "";
var serviceRequestInfo;

exports.sendNoStreamRequest = function (test) {

	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/TesterService/NoStream',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	var requestNoStream = {
		values_to_use: [3, 4],
		type: "MULTIPLICATION",
		info: {
			info: "teststring"
		}
	};

	var expectedResult = 12;

	async.series([function (callback) {

			var httpRequestNoStream = http.request(httpOptions, (res) => {

				res.setEncoding("utf8");
				res.on("data", (data) => {
					console.log("Data: \n" + data);
					var jsonResp = JSON.parse(data);

					requestId = jsonResp.requestId;

					console.log("Received requestId = " + requestId);
          sleepFor(5000);
					callback();
				});
				res.on("end", () => {
					console.log("End: \n");
				});
			});

			httpRequestNoStream.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
			});

			httpRequestNoStream.write(JSON.stringify(requestNoStream));
			httpRequestNoStream.end();

		},
		function (callback) {
			var httpOptions = {
				host: restHost,
				port: restPort,
				path: '/getServiceRequest/?id=' + requestId,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			};

			var httpRequestStatus = http.request(httpOptions, (res) => {
				res.setEncoding("utf8");
				res.on("data", (data) => {
					console.log("Data: \n" + data);
					serviceRequestInfo = JSON.parse(data);
					callback();
				});
				res.on("end", () => {
					console.log("End: \n");
				});
			});

			httpRequestStatus.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
			});

			httpRequestStatus.end();
		}
	], function (err) {
		// every task finished.
		test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
			"but was " + serviceRequestInfo.status);
		test.equals(serviceRequestInfo.service, "NoStream", "Expected service NoStream but was " +
			serviceRequestInfo.service);
		test.equals(serviceRequestInfo.output.map.MULTIPLICATION, expectedResult, "Expected result " +
			expectedResult + " but was " + serviceRequestInfo.output.map.MULTIPLICATION);
		test.done();
	});
}

function sleepFor(duration){
  var now = new Date().getTime();
  while(new Date().getTime() < now + duration){}
}
