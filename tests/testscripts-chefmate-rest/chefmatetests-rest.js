"use strict";
var testCase = require("nodeunit").testCase;
var async = require("async");
var grpc = require("grpc");
const http = require("http");
var _ = require('lodash');
var protoDescriptor = grpc.load("../proto/chefmate.proto");

var restHost = process.env.API_HOST;
var restPort = process.env.API_PORT;

var timeout = 45000;

/**
 * Response messages section
 */
var requestId = "";
var defaultServiceRequestInfo = {
	status: "undefined"
};
var serviceRequestInfo = defaultServiceRequestInfo;
var ec2InstanceDns;

exports.sendCreateVm = function (test) {

	console.log("### TEST sendCreateVM\n\n");
	serviceRequestInfo = defaultServiceRequestInfo;

	var request = {
		name: "chefmatetests",
		tag: "tests",
		region: "eu-central-1",
		imageId: "ami-87564feb",
		username: "ubuntu",
		instanceType: "t2.micro",
		securityGroupIds: ["sg-79ae5d11"]
	};

	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/ec2ops/createvm',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	async.series([
		// Sends the request for service createVm
		function (callback) {
			console.log("### Sending request for Service createVm...");
			var httpRequestCreateVm = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);
				});
				res.on("end", () => {
					var jsonResp = JSON.parse(chunks.join(''));

					requestId = jsonResp.requestId;
					console.log("Data: \n " + JSON.stringify(jsonResp));
					console.log("Found requestId = " + requestId);

					callback();
				});
			});

			httpRequestCreateVm.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});


			httpRequestCreateVm.write(JSON.stringify(request));
			httpRequestCreateVm.end();

		},
		// Requests the RequestServiceInformation for the responded id
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (1)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (2)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (3)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		}
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");

		test.equal(serviceRequestInfo.status , "success", "Expected status success but was " + serviceRequestInfo.status);
		test.equal(serviceRequestInfo.service , "createvm", "Expected service createvm but was " + serviceRequestInfo.service);
		ec2InstanceDns = serviceRequestInfo.output.publicDns;
		console.log("Found publicDns = " + ec2InstanceDns);
		test.done();
	});
}

/////////////////////////////////////////////////////////
exports.sendInitChefRepo = function (test) {

	console.log("### TEST sendInitChefRepo\n\n");
	serviceRequestInfo = defaultServiceRequestInfo;
	var request = {
		credentials: {
			username: "ubuntu",
			host: ec2InstanceDns,
			keyfilename: "chefmateserver_key",
			timeout: 10000
		}
	};

	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/ec2ops/initChefRepo',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	async.series([
		// Sends the request for service createVm
		function (callback) {
			console.log("### Sending request for Service initChefRepo...");
			var httpRequestinitChefRepo = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);
				});
				res.on("end", () => {
					var jsonResp = JSON.parse(chunks.join(''));

					requestId = jsonResp.requestId;
					console.log("Data: \n" + JSON.stringify(jsonResp));
					console.log("Found requestId = " + requestId);
					callback();
				});
			});

			httpRequestinitChefRepo.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});

			httpRequestinitChefRepo.write(JSON.stringify(request));
			httpRequestinitChefRepo.end();

		},
		// Requests the RequestServiceInformation for the responded id
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (1)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (2)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (3)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		}
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");

		test.equal(serviceRequestInfo.status , "success", "Expected status success but was " + serviceRequestInfo.status);
		test.equal(serviceRequestInfo.service , "initchefrepo", "Expected service initchefrepo but was " + serviceRequestInfo.service);

		test.done();
	});
}

/////////////////////////////////////////////////////////
exports.sendDeployWordpress = function (test) {

	console.log("### TEST sendDeployWordpress\n\n");
	serviceRequestInfo = defaultServiceRequestInfo;
	var request = {
		credentials: {
			username: "ubuntu",
			host: ec2InstanceDns,
			keyfilename: "chefmateserver_key",
			timeout: 10000
		},
		dbName: "wordpressdb",
		dbPort: "3306",
		dbUserName: "wordpress",
		dbUserPassword: "cloud16",
		dbRootPassword: "cloud16"
	};

	var httpOptions = {
		host: restHost,
		port: restPort,
		path: '/wordpressops/deploywpapp',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	async.series([
		// Sends the request for service createVm
		function (callback) {
			console.log("### Sending request for Service deploywpapp...");
			var httpRequestDeployWP = http.request(httpOptions, (res) => {
				var chunks = [];
				res.setEncoding("utf8");
				res.on("data", (data) => {
					chunks.push(data);
				});
				res.on("end", () => {
					var jsonResp = JSON.parse(chunks.join(''));

					requestId = jsonResp.requestId;
					console.log("Data: \n" + JSON.stringify(jsonResp));
					console.log("Found requestId = " + requestId);
					callback();
				});
			});

			httpRequestDeployWP.on("error", (err) => {
				console.log("Error with request:\n" + err.message);
				callback();
			});

			httpRequestDeployWP.write(JSON.stringify(request));
			httpRequestDeployWP.end();

		},
		// Requests the RequestServiceInformation for the responded id
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (1)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (2)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		},
		function (callback) {
			console.log("Status = " + serviceRequestInfo.status);
			if (serviceRequestInfo.status != "success") {
				sleepFor(timeout);

				console.log("### (3)Polling status of requestId = " + requestId);

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
			}else{
				console.log("Skip because of status.");
				callback();
			}
		}
		// Executes the tests
	], function (err) {
		console.log("### Executing tests...");

		test.done();
	});
}

function sleepFor(duration) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + duration) {}
}
