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
 * Test section
 */
var successString = "success";
var timeout = 3000;
var users = [{
	firstname: "Volde",
	lastname: "mort"
}, {
	firstname: "Heisen",
	lastname: "berg"
}];

/**
 * Response messages section
 */
var requestId = "";
var streamId = "";
var serviceRequestInfo;

exports.sendNoStreamRequest = function (test) {
	console.log("### TEST sendNoStreamRequest ### \n\n");
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

	async.series([
		// Sends the request for service NoStream
		function (callback) {
			console.log("### Sending request for Service NoStream...");
			var httpRequestNoStream = http.request(httpOptions, (res) => {

				res.setEncoding("utf8");
				res.on("data", (data) => {
					console.log("Data: \n" + data);
					var jsonResp = JSON.parse(data);

					requestId = jsonResp.requestId;

					sleepFor(timeout);
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
		// Requests the RequestServiceInformation for the responded id
		function (callback) {
			console.log("### Requesting the RequestServiceInformation for the responded id...");
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
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");
		test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
			"but was " + serviceRequestInfo.status);
		test.equals(serviceRequestInfo.service, "NoStream", "Expected service NoStream but was " +
			serviceRequestInfo.service);
		test.equals(serviceRequestInfo.output.map.MULTIPLICATION, expectedResult, "Expected result " +
			expectedResult + " but was " + serviceRequestInfo.output.map.MULTIPLICATION);
		test.done();
	});
}

exports.sendRequestStreamRequest = function (test) {
	console.log("### TEST sendRequestStreamRequest ### \n\n");

	var httpOptionsOpenStream = {
		host: restHost,
		port: restPort,
		path: '/TesterService/RequestStream/OpenStream',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	async.series([
			// Send request to open stream for service StreamRequest
			function (callback) {
				console.log("### Sending request to open stream for service StreamRequest...");
				var httpRequestOpenStream = http.request(httpOptionsOpenStream, (res) => {

					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
						var jsonResp = JSON.parse(data);

						requestId = jsonResp.requestId;
						streamId = jsonResp.streamId;

						sleepFor(timeout);
						callback();
					});
					res.on("end", () => {
						console.log("End: \n");
					});
				});

				httpRequestOpenStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
				});

				httpRequestOpenStream.end();

			},
			// Send first requests to the recently opened Stream
			function (callback) {
				console.log("### Sending first request to the recently opened Stream...");
				var httpOptionsRequestToStream = {
					host: restHost,
					port: restPort,
					path: '/TesterService/RequestStream/?id=' + streamId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestAddUser = http.request(httpOptionsRequestToStream, (res) => {

					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
						sleepFor(timeout);
						callback();
					});
					res.on("end", () => {
						console.log("End: \n");
					});
				});

				httpRequestAddUser.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
				});

				httpRequestAddUser.write(JSON.stringify(users[0]));
				httpRequestAddUser.end();
			},
			// Send second requests to the recently opened Stream
			function (callback) {
				console.log("### Sending second request to the recently opened Stream...");
				var httpOptionsRequestToStream = {
					host: restHost,
					port: restPort,
					path: '/TesterService/RequestStream/?id=' + streamId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestAddUser = http.request(httpOptionsRequestToStream, (res) => {

					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
						sleepFor(timeout);
						callback();
					});
					res.on("end", () => {
						console.log("End: \n");
					});
				});

				httpRequestAddUser.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
				});

				httpRequestAddUser.write(JSON.stringify(users[1]));
				httpRequestAddUser.end();
			},
			// Close the stream
			function (callback) {
				console.log("### Sending request to close stream for service StreamRequest...");
				var httpOptionsCloseStream = {
					host: restHost,
					port: restPort,
					path: '/TesterService/RequestStream/CloseStream/?id=' + streamId,
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestCloseStream = http.request(httpOptionsCloseStream, (res) => {

					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
						sleepFor(timeout);
						callback();
					});
					res.on("end", () => {
						console.log("End: \n");
					});
				});

				httpRequestCloseStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
				});

				httpRequestCloseStream.end();
			},
			// Check for the qty of added users
			function (callback) {
				console.log("### Requesting the RequestServiceInformation for the responded id...");
				var httpOptionsUsers = {
					host: restHost,
					port: restPort,
					path: '/getServiceRequest/?id=' + requestId,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestUsers = http.request(httpOptionsUsers, (res) => {

					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
						serviceRequestInfo = JSON.parse(data);
						sleepFor(timeout);
						callback();
					});
					res.on("end", () => {
						console.log("End: \n");
					});
				});

				httpRequestUsers.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
				});

				httpRequestUsers.end();
			}
		],
		function (err) {
			console.log("### Executing tests...");
			test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
				"but was " + serviceRequestInfo.status);
			test.equals(serviceRequestInfo.service, "RequestStream", "Expected service NoStream but was " +
				serviceRequestInfo.service);
			var actualQty = parseInt(serviceRequestInfo.output.qty);
			console.log("acutalQty = " + (typeof actualQty));
			var userQtyExpected = 2;
			test.equals(actualQty, userQtyExpected, "Expected user qty " +
				userQtyExpected + " but was " + actualQty);
			test.done();
		});
}

function sleepFor(duration) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + duration) {}
}
