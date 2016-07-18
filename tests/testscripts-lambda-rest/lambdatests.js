"use strict";
var grpc = require("grpc");
var testCase = require("nodeunit").testCase;
var async = require("async");
var protoDescriptor = grpc.load("../proto/lambda.proto");
var http = require("http");

var timeout = 3000;

var restHost = process.env.API_HOST;
var restPort = process.env.API_PORT;

var successString = "success";
var functionName = "";
var functionResponse;
var requestId = "";
var serviceRequestInfo;
var deleteOutputMsg = "";

exports.sendCreate = function (test) {
	console.log("### Test sendCreate.###\n\n");
	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/LambdaOps/createFunction',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	var request = {
		Code: { /* required */
			S3Bucket: 'lambdaapi',
			S3Key: 'LambdaFunctionOverHttps.zip',
			S3ObjectVersion: 'JBm1hOQpBmTRm33wsUsOHSHOonO2qlHj'
				//  ZipFile: new Buffer('...') || 'STRING_VALUE'
		},
		FunctionName: 'LambdaFunctionOverHttps',
		Handler: 'LambdaFunctionOverHttps.handler',
		Role: 'arn:aws:iam::927707579246:role/lambda_basic_execution',
		Runtime: 'nodejs4.3', //'nodejs | nodejs4.3 | java8 | python2.7',/* required */
		Description: 'Nodejs testing ',
		MemorySize: 128,
		Publish: true
	};

	async.series([
			function (callback) {
				var httpRequest = http.request(httpOptions, (res) => {
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
						console.log("End \n");
					});
				});

				httpRequest.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequest.write(JSON.stringify(request));
				httpRequest.end();
			},
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
						console.log("Data: \n" + data);
					});
					res.on("end", () => {
						console.log("End \n");
						serviceRequestInfo = JSON.parse(chunks.join(''));
						console.log("serviceRequestInfo: \n" + serviceRequestInfo);
						var output = serviceRequestInfo['output'];
						var outputLogs = output['outputLog'];
						console.log("outputLogs: \n" + outputLogs);
						var parsedOutput = JSON.parse(outputLogs);
						functionName = parsedOutput['FunctionName'];
						console.log("Found function name: " + functionName);
						callback();
					});
				});

				httpRequestStatus.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestStatus.end();
			}

		],
		function (err) {
			console.log("### Executing tests...");
			test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
				"but was " + serviceRequestInfo.status);
			test.equals(functionName, 'LambdaFunctionOverHttps', "Expected " + functionName + " but was LambdaFunctionOverHttps.");
			test.done();
		}
	);
}

exports.sendGet = function (test) {
	console.log("### Test sendGet.###\n\n");
	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/LambdaOps/getFunction',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	var request = {
		FunctionName: 'LambdaFunctionOverHttps'
	};

	async.series([
			function (callback) {
				var httpRequest = http.request(httpOptions, (res) => {
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
						console.log("End \n");
					});
				});

				httpRequest.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequest.write(JSON.stringify(request));
				httpRequest.end();
			},
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
					res.setEncoding("utf8");
					var chunks = [];
					res.on("data", (data) => {
						chunks.push(data);
						console.log("Data: \n" + data);
					});
					res.on("end", () => {
						console.log("End \n");
						console.log("chunks: \n" + chunks);
						serviceRequestInfo = JSON.parse(chunks.join(''));
						console.log("serviceRequestInfo: \n" + serviceRequestInfo);
						var output = serviceRequestInfo['output'];
						var outputLogs = output['outputLog'];
						console.log("outputLogs: \n" + outputLogs);
						var parsedOutput = JSON.parse(outputLogs);
						var config = parsedOutput['Configuration']
						functionName = config['FunctionName'];

						console.log("Found function name: " + functionName);
						callback();
					});
				});

				httpRequestStatus.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestStatus.end();
			}

		],
		function (err) {

			console.log("### Executing tests...");
			test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
				"but was " + serviceRequestInfo.status);
			test.equals(functionName, 'LambdaFunctionOverHttps', "Epected " + functionName + " but was LambdaFunctionOverHttps.");
			test.done();
		}
	);
}

exports.sendDelete = function (test) {
	console.log("### Test sendDelete.###\n\n");
	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/LambdaOps/deleteFunction',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	var request = {
		FunctionName: 'LambdaFunctionOverHttps'
	};

	async.series([
			function (callback) {
				var httpRequest = http.request(httpOptions, (res) => {
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

				httpRequest.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequest.write(JSON.stringify(request));
				httpRequest.end();
			},
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
						console.log("Data: \n" + data);
					});
					res.on("end", () => {
						console.log("End \n");
						console.log("chunks: \n" + chunks);
						serviceRequestInfo = JSON.parse(chunks.join(''));
						console.log("serviceRequestInfo: \n" + serviceRequestInfo);
						var output = serviceRequestInfo['output'];
						var outputLogs = output['outputLog'];

						var parsedOutput = JSON.stringify(outputLogs[0]);
						deleteOutputMsg = parsedOutput.replace(/"/g, '');
						console.log("parsedOutput: '" + parsedOutput + "':" + (typeof parsedOutput));
						callback();
					});
				});

				httpRequestStatus.on("error", (err) => {
					console.log("Error with request:\n" + err.message);
					callback();
				});

				httpRequestStatus.end();
			}

		],
		function (err) {
			console.log("### Executing tests...");
			console.log(serviceRequestInfo);
			test.equals(serviceRequestInfo.status, successString, "Expected status " + successString +
				"but was " + serviceRequestInfo.status);
			var deleteMsg = 'successfully deleted the function';
			test.equals(deleteOutputMsg, deleteMsg, "Expected " + deleteMsg + " but was " + deleteOutputMsg);
			test.done();
		}
	);
}

function sleepFor(duration) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + duration) {}
}
