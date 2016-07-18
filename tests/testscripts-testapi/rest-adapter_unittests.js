"use strict";
var testCase = require("nodeunit").testCase;
var async = require("async");
var grpc = require("grpc");
const http = require("http");
var _ = require('lodash');
var protoDescriptor = grpc.load("../proto/tester.proto");

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
var serviceRequestInfo;

exports.sendNostreamRequest = function (test) {
	console.log("### TEST sendNostreamRequest ### \n\n");
	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/testerservice/nostream',
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
			console.log("### Sending request for Service noStream...");
			var httpRequestNoStream = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);

				});
				res.on("end", () => {
					var jsonResp = JSON.parse(chunks.join(''));
					console.log("Data: \n" + JSON.stringify(jsonResp));

					requestId = jsonResp.requestId;

					sleepFor(timeout);
					callback();
				});
			});

			httpRequestNoStream.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
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
				path: '/service-request/' + requestId,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			};

			var httpRequestStatus = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);

				});
				res.on("end", () => {
					serviceRequestInfo = JSON.parse(chunks.join(''));
					console.log("Data: \n" + JSON.stringify(serviceRequestInfo));
					callback();
				});
			});

			httpRequestStatus.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});

			httpRequestStatus.end();
		}
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");
		test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
			"but was " + serviceRequestInfo.status);
		test.equals(serviceRequestInfo.service, "nostream", "Expected service nostream but was " +
			serviceRequestInfo.service);
		test.equals(serviceRequestInfo.output.map.MULTIPLICATION, expectedResult, "Expected result " +
			expectedResult + " but was " + serviceRequestInfo.output.map.MULTIPLICATION);
		test.done();
	});
}

exports.sendRequeststreamRequest = function (test) {
	console.log("### TEST sendRequeststreamRequest ### \n\n");

	var httpOptionsOpenStream = {
		host: restHost,
		port: restPort,
		path: '/testerservice/requeststream/',
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
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var jsonResp = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(jsonResp));

						requestId = jsonResp.requestId;

						sleepFor(timeout);
						callback();
					});
				});

				httpRequestOpenStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestOpenStream.end();

			},
			// Send first requests to the recently opened Stream
			function (callback) {
				console.log("### Sending first request to the recently opened Stream...");
				var httpOptionsRequestToStream = {
					host: restHost,
					port: restPort,
					path: '/testerservice/requeststream/' + requestId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestAddUser = http.request(httpOptionsRequestToStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var data = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(data));
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestAddUser.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
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
					path: '/testerservice/requeststream/' + requestId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestAddUser = http.request(httpOptionsRequestToStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var data = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(data));
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestAddUser.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
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
					path: '/testerservice/requeststream/' + requestId,
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestCloseStream = http.request(httpOptionsCloseStream, (res) => {
					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
					});
					res.on("end", () => {
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestCloseStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestCloseStream.end();
			},
			// Check for the qty of added users
			function (callback) {
				console.log("### Requesting the RequestServiceInformation for the responded id...");
				var httpOptionsUsers = {
					host: restHost,
					port: restPort,
					path: '/service-request/' + requestId,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestUsers = http.request(httpOptionsUsers, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						serviceRequestInfo = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(serviceRequestInfo));
						sleepFor(timeout);
						callback();
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
			test.equals(serviceRequestInfo.service, "requeststream", "Expected service requeststream but was " +
				serviceRequestInfo.service);
			var actualQty = parseInt(serviceRequestInfo.output.qty);
			var userQtyExpected = 2;
			test.equals(actualQty, userQtyExpected, "Expected user qty " +
				userQtyExpected + " but was " + actualQty);
			test.done();
		});
}

exports.sendResponseStreamRequest = function (test) {
	console.log("### TEST sendResponsestreamRequest ### \n\n");

	var httpOptionsResponseStream = {
		host: restHost,
		port: restPort,
		path: '/testerservice/responsestream/',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	var request = {
		limit: 100
	};

	async.series([
		// Sends the request for service NoStream
		function (callback) {
			console.log("### Sending request for Service Responsestream...");
			var httpRequestResponseStream = http.request(httpOptionsResponseStream, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);
				});
				res.on("end", () => {
					var jsonResp = JSON.parse(chunks.join(''));
					console.log("Data: \n" + JSON.stringify(jsonResp));

					requestId = jsonResp.requestId;

					sleepFor(timeout);
					callback();
				});
			});

			httpRequestResponseStream.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});

			httpRequestResponseStream.write(JSON.stringify(request));
			httpRequestResponseStream.end();

		},
		// Requests the RequestServiceInformation for the responded id
		function (callback) {
			console.log("### Requesting the RequestServiceInformation for the responded id...");
			var httpOptions = {
				host: restHost,
				port: restPort,
				path: '/service-request/' + requestId,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			};

			var httpRequestStatus = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);
				});
				res.on("end", () => {
					serviceRequestInfo = JSON.parse(chunks.join(''));
					console.log("Data: \n" + JSON.stringify(serviceRequestInfo));
					callback();
				});
			});

			httpRequestStatus.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});

			httpRequestStatus.end();
		}
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");
		test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
			"but was " + serviceRequestInfo.status);
		test.equals(serviceRequestInfo.service, "responsestream", "Expected service responsestream but was " +
			serviceRequestInfo.service);
		var expectedDataQty = 2;
		test.equals(serviceRequestInfo.output.length, expectedDataQty, "Expected output qty " + expectedDataQty +
			" but was " + serviceRequestInfo.output.length);
		test.done();
	});

}

exports.sendBidirectionalstreamRequest = function (test) {
	console.log("### TEST sendBidirectionalstreamRequest ### \n\n");

	var httpOptionsOpenStream = {
		host: restHost,
		port: restPort,
		path: '/testerservice/bidirectionalstream/',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	async.series([
			// Send request to open stream for service StreamRequest
			function (callback) {
				console.log("### Sending request to open stream for service bidirectionalstream...");
				var httpRequestOpenStream = http.request(httpOptionsOpenStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var jsonResp = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(jsonResp));

						requestId = jsonResp.requestId;

						sleepFor(timeout);
						callback();
					});
				});

				httpRequestOpenStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestOpenStream.end();

			},
			// Send first requests to the recently opened Stream
			function (callback) {
				console.log("### Sending first request to the recently opened Stream...");
				var httpOptionsRequestToStream = {
					host: restHost,
					port: restPort,
					path: '/testerservice/bidirectionalstream/' + requestId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestGreeting = http.request(httpOptionsRequestToStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var data = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(data));
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestGreeting.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				var body = {
					name: "Heisenberg"
				};

				httpRequestGreeting.write(JSON.stringify(body));
				httpRequestGreeting.end();
			},
			// Send second requests to the recently opened Stream
			function (callback) {
				console.log("### Sending second request to the recently opened Stream...");
				var httpOptionsRequestToStream = {
					host: restHost,
					port: restPort,
					path: '/testerservice/bidirectionalstream/' + requestId,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				};

				var httpRequestGreeting = http.request(httpOptionsRequestToStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {
						var data = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(data));
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestGreeting.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				var body = {
					name: "Voldemort"
				};

				httpRequestGreeting.write(JSON.stringify(body));
				httpRequestGreeting.end();
			},
			// Close the stream
			function (callback) {
				console.log("### Sending request to close stream for service Bidirectionalstream...");
				var httpOptionsCloseStream = {
					host: restHost,
					port: restPort,
					path: '/testerservice/bidirectionalstream/' + requestId,
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestCloseStream = http.request(httpOptionsCloseStream, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						console.log("Data: \n" + data);
					});
					res.on("end", () => {
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestCloseStream.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestCloseStream.end();
			},
			// Check for the qty of added users
			function (callback) {
				console.log("### Requesting the RequestServiceInformation for the responded id...");
				var httpOptionsGreeting = {
					host: restHost,
					port: restPort,
					path: '/service-request/' + requestId,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				};
				var httpRequestGreeting = http.request(httpOptionsGreeting, (res) => {
					var chunks = [];
					res.setEncoding("utf8");
					res.on("data", (data) => {
						chunks.push(data);
					});
					res.on("end", () => {

						serviceRequestInfo = JSON.parse(chunks.join(''));
						console.log("Data: \n" + JSON.stringify(serviceRequestInfo));
						sleepFor(timeout);
						callback();
					});
				});

				httpRequestGreeting.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestGreeting.end();
			}
		],
		function (err) {
			console.log("### Executing tests...");
			test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
				"but was " + serviceRequestInfo.status);
			test.equals(serviceRequestInfo.service, "bidirectionalstream", "Expected service bidirectionalstream but was " +
				serviceRequestInfo.service);
			var expectedDataQty = 2;
			test.equals(serviceRequestInfo.output.length, expectedDataQty, "Expected output qty " + expectedDataQty +
				" but was " + serviceRequestInfo.output.length);
			test.done();
		});
}

function sleepFor(duration) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + duration) {}
}
