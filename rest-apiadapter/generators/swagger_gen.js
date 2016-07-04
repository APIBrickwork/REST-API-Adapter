"use strict";
/**
 * Code-Generator which consumes a proto3-file and generates the according
 * Swagger.io file which can be used for documentation or REST interface specification.
 * author: Tobias Freundorfer (https://github.com/tfreundo)
 */
var fs = require("fs");
var protobuf = require("protobufjs");
var util = require("util");
var metadataReader = require("./metadataReader.js");

/**
* Metadata
*/
var metadataFile = "/api/metadata.json"
var metadata = {
	// Default values used if nothing is specified
	title: "gRPC-API-Adapter (REST)",
	version: "1.0"
};

/**
 * Project definitions
 */
var output = "./swagger.yaml";
var host = "localhost";
var port = 10010;

if (!(typeof process.env.REST_LISTEN_PORT === 'undefined')) {
	port = process.env.REST_LISTEN_PORT;
}

/**
 * Protobuf definitions
 */
var protoFile = "/api/main.proto";

if(!(typeof process.env.API_PROTO_PATH === 'undefined')){
	protoFile = process.env.API_PROTO_PATH;
}
var protoParser = new protobuf.DotProto.Parser(fs.readFileSync(protoFile));

if (require.main === module) {
	console.log("swagger_gen.js using environment variables:\n" +
		"REST_LISTEN_PORT = " + port + " | API_PROTO_PATH = " + protoFile);
	main();
}

function main() {

	var metadataResult = metadataReader.readMetadata(metadataFile);

	// If not undefined use the specified values instead of the default ones
	if(!(metadataResult === "undefined")){
		console.log("swagger_gen.js: Using custom metadata.")
		metadata = metadataResult;
	}

	fs.writeFileSync(output, "swagger: \"2.0\"\n");
	var protoObj = protoParser.parse();
	appendDescription();
	appendPaths(protoObj);
	appendStaticDefinitions();
	appendDynamicDefinitions(protoObj.messages);
	appendEnumDefinitions(protoObj);
}
/**
 * Appends the static descriptions to the output swagger file.
 */
function appendDescription() {
	fs.appendFileSync(output, "info:\n");
	fs.appendFileSync(output, " version: \"" + metadata.version + "\"\n");
	fs.appendFileSync(output, " title: " + metadata.title + "\n");
	fs.appendFileSync(output, "host: " + host + ":" + port + "\n");
	fs.appendFileSync(output, "basePath: /\n");
	fs.appendFileSync(output, "schemes:\n \- http\n \- https\n");
	fs.appendFileSync(output, "consumes:\n - application/json\n");
	fs.appendFileSync(output, "produces:\n - application/json\n");
}

/**
 * Wraps the appending of static and dynamic paths for the given parsed
 * proto object.
 * @param {protoObj} The proto object that resulted from parsing the file.
 */
function appendPaths(protoObj) {
	fs.appendFileSync(output, "paths:\n");
	appendStaticPaths();
	appendDynamicPaths(protoObj);
	fs.appendFileSync(output, " /swagger:\n");
	fs.appendFileSync(output, "  x-swagger-pipe: swagger_raw\n");
}

/**
 * Appends the static paths.
 */
function appendStaticPaths() {
	// Get helppage (returns html representation of swagger specification)
	fs.appendFileSync(output, " /help:\n");
	fs.appendFileSync(output, "  x-swagger-router-controller: helppage\n");
	fs.appendFileSync(output, "  get:\n");
	fs.appendFileSync(output, "   description: Returns a HTML representation of the Swagger specification.\n");
	fs.appendFileSync(output, "   operationId: getPage\n");
	fs.appendFileSync(output, "   produces:\n");
	fs.appendFileSync(output, "    - text/html\n");
	fs.appendFileSync(output, "   responses:\n");
	fs.appendFileSync(output, "    200:\n");
	fs.appendFileSync(output, "     description: Success\n");

	// Get service requests path
	fs.appendFileSync(output, " /service-request/{id}:\n");
	fs.appendFileSync(output, "  x-swagger-router-controller: getSerReq\n");
	fs.appendFileSync(output, "  get:\n");
	fs.appendFileSync(output, "    parameters:\n");
	fs.appendFileSync(output, "     - name: id\n");
	fs.appendFileSync(output, "       in: path\n");
	fs.appendFileSync(output, "       required: true\n");
	fs.appendFileSync(output, "       description: The ServiceRequestId to query for.\n");
	fs.appendFileSync(output, "       type: string\n");
	fs.appendFileSync(output, "    description: Gets information for the specified ServiceRequestId.\n");
	fs.appendFileSync(output, "    operationId: getSerReq\n");
	fs.appendFileSync(output, "    produces:\n");
	fs.appendFileSync(output, "     - application/json\n");
	fs.appendFileSync(output, "    responses:\n");
	fs.appendFileSync(output, "     200:\n");
	fs.appendFileSync(output, "      description: Success\n");
	fs.appendFileSync(output, "      schema:\n");
	fs.appendFileSync(output, "       $ref: \"#/definitions/ServiceRequestInfo\"\n\n");
	fs.appendFileSync(output, "     default:\n");
	fs.appendFileSync(output, "      description: Error\n");
	fs.appendFileSync(output, "      schema:\n");
	fs.appendFileSync(output, "       $ref: \"#/definitions/ErrorResponse\"\n");
}

/**
 * Appends the dynamic paths for the given parsed proto object.
 * @param {protoObj} The proto object that resulted from parsing the file.
 */
function appendDynamicPaths(protoObj) {

	for (var i = 0; i < protoObj.services.length; i++) {
		for (var rpcName in protoObj.services[i].rpc) {

			// Check if there is a request stream that has to be opened and closed
			var isRequestStream = protoObj.services[i].rpc[rpcName].request_stream;

			var serviceNameLowerCase = protoObj.services[i].name.toLowerCase();
			var rpcNameLowerCase = rpcName.toLowerCase();

			if (isRequestStream) {
				fs.appendFileSync(output, " /" + serviceNameLowerCase +
					"/" + rpcNameLowerCase + "/{id}:\n");
			} else {
				fs.appendFileSync(output, " /" + serviceNameLowerCase +
					"/" + rpcNameLowerCase + ":\n");
			}

			fs.appendFileSync(output, "  x-swagger-router-controller: " +
				"gen_" + protoObj.services[i].name + "\n");

			fs.appendFileSync(output, "  post:\n");
			fs.appendFileSync(output, "   parameters:\n");
			if (isRequestStream) {
				fs.appendFileSync(output, "    - name: id\n");
				fs.appendFileSync(output, "      in: path\n");
				fs.appendFileSync(output, "      required: true\n");
				fs.appendFileSync(output, "      description: The ServiceRequestId to query for.\n");
				fs.appendFileSync(output, "      type: string\n");
			}
			var requestType = protoObj.services[i].rpc[rpcName].request;
			var swaggerRef = getSwaggerRefDefinition(requestType);
			fs.appendFileSync(output, "    - name: " + requestType + "\n");
			fs.appendFileSync(output, "      in: body\n");
			fs.appendFileSync(output, "      required: true\n");
			fs.appendFileSync(output, "      schema:\n");
			fs.appendFileSync(output, "       " + swaggerRef + "\n");
			fs.appendFileSync(output, "   description: gRPC-Service " + rpcName + "\n");
			fs.appendFileSync(output, "   operationId: " + rpcName + "\n");
			fs.appendFileSync(output, "   consumes:\n");
			fs.appendFileSync(output, "    - application/json\n");
			fs.appendFileSync(output, "   produces:\n");
			fs.appendFileSync(output, "    - application/json\n");
			fs.appendFileSync(output, "   responses:\n");
			fs.appendFileSync(output, "    200:\n");
			fs.appendFileSync(output, "     description: Success\n");
			fs.appendFileSync(output, "     schema:\n");
			fs.appendFileSync(output, "      $ref: \"#/definitions/ServiceRequestResponse\"\n");
			fs.appendFileSync(output, "    default:\n");
			fs.appendFileSync(output, "     description: Error\n");
			fs.appendFileSync(output, "     schema:\n");
			fs.appendFileSync(output, "      $ref: \"#/definitions/ErrorResponse\"\n");

			if (isRequestStream) {
				appendCloseStreamPath(protoObj.services[i].name, rpcName);
				appendOpenStreamPath(protoObj.services[i].name, rpcName);
			}
		}
	}
}

/**
 * Appends a path for close stream functionality (necessary if service has a request stream).
 * @param {grpcServiceName} The name of the gRPC Service.
 * @param {rpcName} The name of the RPC of the gRPC Service.
 */
function appendCloseStreamPath(grpcServiceName, rpcName) {

	fs.appendFileSync(output, "  delete:\n");
	fs.appendFileSync(output, "   parameters:\n");
	fs.appendFileSync(output, "    - name: id\n");
	fs.appendFileSync(output, "      in: path\n");
	fs.appendFileSync(output, "      required: true\n");
	fs.appendFileSync(output, "      description: The StreamId to delete.\n");
	fs.appendFileSync(output, "      type: string\n");
	fs.appendFileSync(output, "   description: Deletes/closes a given Stream for gRPC-Service " +
		rpcName + "\n");

	fs.appendFileSync(output, "   operationId: " + rpcName + "CloseStream" + "\n");
	fs.appendFileSync(output, "   produces:\n");
	fs.appendFileSync(output, "    - text/plain\n");
	fs.appendFileSync(output, "   responses:\n");
	fs.appendFileSync(output, "    200:\n");
	fs.appendFileSync(output, "     description: Success\n");
	fs.appendFileSync(output, "     schema:\n");
	fs.appendFileSync(output, "      title: " + rpcName + "CloseStreamResponse" + " \n");
	fs.appendFileSync(output, "      type: string\n");
	fs.appendFileSync(output, "    default:\n");
	fs.appendFileSync(output, "     description: Error\n");
	fs.appendFileSync(output, "     schema:\n");
	fs.appendFileSync(output, "      $ref: \"#/definitions/ErrorResponse\"\n");
}

/**
 * Appends a path for open stream functionality (necessary if service has a request stream).
 * @param {grpcServiceName} The name of the gRPC Service.
 * @param {rpcName} The name of the RPC of the gRPC Service.
 */
function appendOpenStreamPath(grpcServiceName, rpcName) {
	var serviceNameLowerCase = grpcServiceName.toLowerCase();
	var rpcNameLowerCase = rpcName.toLowerCase();

	fs.appendFileSync(output, " /" + serviceNameLowerCase +
		"/" + rpcNameLowerCase + "/:\n");

	fs.appendFileSync(output, "  x-swagger-router-controller: " +
		"gen_" + grpcServiceName + "\n");
	fs.appendFileSync(output, "  get:\n");
	fs.appendFileSync(output, "   description: Opens a Stream for gRPC-Service " + rpcName + "\n");

	fs.appendFileSync(output, "   operationId: " + rpcName + "OpenStream" + "\n");
	fs.appendFileSync(output, "   produces:\n");
	fs.appendFileSync(output, "    - application/json\n");
	fs.appendFileSync(output, "   responses:\n");
	fs.appendFileSync(output, "    200:\n");
	fs.appendFileSync(output, "     description: Success\n");
	fs.appendFileSync(output, "     schema:\n");
	fs.appendFileSync(output, "      $ref: \"#/definitions/ServiceRequestResponse\"\n\n");
	fs.appendFileSync(output, "    default:\n");
	fs.appendFileSync(output, "     description: Error\n");
	fs.appendFileSync(output, "     schema:\n");
	fs.appendFileSync(output, "      $ref: \"#/definitions/ErrorResponse\"\n");
}

/**
 * Appends static definitions.
 */
function appendStaticDefinitions() {
	fs.appendFileSync(output, "definitions:\n");
	fs.appendFileSync(output, " ErrorResponse:\n");
	fs.appendFileSync(output, "  required:\n");
	fs.appendFileSync(output, "   - message\n");
	fs.appendFileSync(output, "  properties:\n");
	fs.appendFileSync(output, "   message:\n");
	fs.appendFileSync(output, "    type: string\n");
	fs.appendFileSync(output, " ServiceRequestResponse:\n");
	fs.appendFileSync(output, "  required:\n");
	fs.appendFileSync(output, "   - requestId\n");
	fs.appendFileSync(output, "  properties:\n");
	fs.appendFileSync(output, "   requestId:\n");
	fs.appendFileSync(output, "    type: string\n");
	fs.appendFileSync(output, " ServiceRequestInfo:\n");
	fs.appendFileSync(output, "  required:\n");
	fs.appendFileSync(output, "   - status\n");
	fs.appendFileSync(output, "   - service\n");
	fs.appendFileSync(output, "  properties:\n");
	fs.appendFileSync(output, "   status:\n");
	fs.appendFileSync(output, "    type: string\n");
	fs.appendFileSync(output, "   service:\n");
	fs.appendFileSync(output, "    type: string\n");
	fs.appendFileSync(output, "   output:\n");
	fs.appendFileSync(output, "    type: [string, object, array]\n");
}

/**
 * Appends dynamic definitions for the given Array of proto messages.
 * @param {messages} Array containing all messages of the given parsed
 * proto object for which a definition should be added.
 */
function appendDynamicDefinitions(messages) {
	for (var i = 0; i < messages.length; i++) {
		var messageName = messages[i].name;

		if (messages[i].messages.length > 0) {
			appendDynamicDefinitions(messages[i].messages);
		}

		fs.appendFileSync(output, " " + messageName + ":\n");
		fs.appendFileSync(output, "  properties:\n");
		// TODO: Currently missing: options, oneofs (Because useless for REST here??)
		for (var j = 0; j < messages[i].fields.length; j++) {
			var rule = messages[i].fields[j].rule;
			var type = messages[i].fields[j].type;
			var fieldName = messages[i].fields[j].name;
			var options = messages[i].fields[j].options;
			var id = messages[i].fields[j].id;
			fs.appendFileSync(output, "   " + fieldName + ":\n");
			// Special case because maps are currently not supported by swagger
			if (rule == "map" || rule == "repeated") {
				appendMapArrayDefinition(type);
			} else if (isPrimitiveDataType(type)) {
				fs.appendFileSync(output, "    type: " + convertDataTypeProto3ToSwagger(type) +
					"\n");
			} else {
				fs.appendFileSync(output, "    " + getSwaggerRefDefinition(type) + "\n");
			}
		}
	}
}

/**
 * Appends the enum definitions for the given Array of enums.
 * @param {enums} Array containing all enums of the given parsed
 * proto object for which a definition should be added.
 */
function appendEnumDefinitions(protoObj) {
	// TODO: Change to enum as input parameter!! And evaluate that it is still working
	// TODO: After doing that the description is correct
	for (var i = 0; i < protoObj.enums.length; i++) {

		var enumName = protoObj.enums[i].name;
		fs.appendFileSync(output, " " + enumName + ":\n");
		fs.appendFileSync(output, "  type: string\n");
		fs.appendFileSync(output, "  enum: [");
		for (var j = 0; j < protoObj.enums[i].values.length; j++) {
			var valueName = protoObj.enums[i].values[j].name;
			fs.appendFileSync(output, "\"" + valueName + "\"");

			if (j < protoObj.enums[i].values.length - 1) {
				fs.appendFileSync(output, ",");
			}
		}
		fs.appendFileSync(output, "]\n");
	}
}

/**
 * Converts the given proto3 data type to the according swagger data type.
 * @param {protoType} The proto3 data type that should be converted.
 * @return The according swagger data type.
 */
function convertDataTypeProto3ToSwagger(protoType) {
	if (protoType === "int32") {
		return "integer";
	} else if (protoType === "int64") {
		return "integer";
	} else if (protoType === "float") {
		return "number";
	} else if (protoType === "double") {
		return "number";
	} else if (protoType === "bytes") {
		return "string";
	} else if (protoType === "bool") {
		return "boolean";
	} else if (protoType === "Timestamp") {
		return "string";
	} else {
		return "string";
	}
}

/**
 * Determines whether the given proto3 data type is a primitive data type.
 * @param {protoType} The proto3 data type that should be checked.
 * @return Whether the data type is a primitive or not.
 */
function isPrimitiveDataType(protoType) {
	if (protoType === "int32" || protoType === "int64" ||
		protoType === "float" || protoType === "double" ||
		protoType === "bytes" || protoType === "bool" ||
		protoType === "Timestamp" || protoType === "string") {
		return true;
	}
	return false;
}

/**
 * Creates the reference definiton for a given swagger data type.
 * @param {dataType} The swagger data type which should be referenced.
 * @return The reference string for the given swagger data type.
 */
function getSwaggerRefDefinition(dataType) {
	return "$ref: \"#/definitions/" + dataType + "\"";
}

/**
 * Appends the map and array definitions (if it was map or repeated in proto3).
 * @param {type} The type of the items within.
 */
function appendMapArrayDefinition(type) {
	fs.appendFileSync(output, "    type: array\n");
	fs.appendFileSync(output, "    items:\n");
	if (isPrimitiveDataType(type)) {
		fs.appendFileSync(output, "     type: " +
			convertDataTypeProto3ToSwagger(type) + "\n");
	} else {
		fs.appendFileSync(output, "     " + getSwaggerRefDefinition(type) + "\n");
	}
}
