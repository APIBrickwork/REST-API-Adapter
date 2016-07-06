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

// Array holding all proto objects (main and all recursively added imports)
var protoObjects = [];

/**
 * Metadata
 */
var metadataFile = "/api/metadata.json"

if (!(typeof process.env.METADATA_PATH === 'undefined')) {
	metadataFile = process.env.METADATA_PATH;
}

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

if (!(typeof process.env.API_PROTO_PATH === 'undefined')) {
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
	if (!(metadataResult === "undefined")) {
		console.log("swagger_gen.js: Using custom metadata.")
		metadata = metadataResult;
	}

	fs.writeFileSync(output, "swagger: \"2.0\"\n");
	var protoObj = protoParser.parse();

	protoObjects.push(protoObj);

	handleImportedProtoFiles(protoObj);

	appendDescription();
	appendPaths(protoObjects);
	appendStaticDefinitions();

	for (var i = 0; i < protoObjects.length; i++) {

		var packagename = protoObjects[i].package;

		if (packagename === null || packagename === "undefined") {
			packagename = "";
		} else {
			packagename += ".";
		}

		appendDynamicDefinitions(protoObjects[i].messages, packagename, protoObjects[i]);
		appendEnumDefinitions(protoObjects[i].enums, packagename);

		// append nested enums
		for (var j = 0; j < protoObjects[i].messages.length; j++) {
			for (var k = 0; k < protoObjects[i].messages[j].enums.length; k++) {
				var arr = [];
				arr.push(protoObjects[i].messages[j].enums[k]);
				// For nested enums add the message name because it's possible to define
				// nested enums with the same name in different messages which would lead to
				// duplicate defintions
				appendEnumDefinitions(arr, packagename + protoObjects[i].messages[j].name + ".");
			}
		}
	}
}

/**
 * Will handle imports recursively to find all necessary proto files.
 * @param {mainProtoObj} The main proto object that should be used as starting point.
 */
function handleImportedProtoFiles(mainProtoObj) {
	console.log("Resolving imports...");
	console.log("Import Qty = " + mainProtoObj.imports.length);

	for (var i = 0; i < mainProtoObj.imports.length; i++) {
		var parser = new protobuf.DotProto.Parser(fs.readFileSync("./" + mainProtoObj.imports[i]));
		var obj = parser.parse();

		// Check for nested imports
		if (obj.imports.length > 0) {
			console.log("Found nested imports. Doing recursion...");
			handleImportedProtoFiles(obj);
		}

		protoObjects.push(obj);
	}

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
 */
function appendPaths() {
	fs.appendFileSync(output, "paths:\n");
	appendStaticPaths();
	for (var i = 0; i < protoObjects.length; i++) {
		appendDynamicPaths(protoObjects[i]);
	}
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

			var packagename;
			// if message name already specifies the package to use
			if (requestType.includes(".")) {
				// empty because it's part of the messagename itself here
				packagename = "";
				// Remove trailing dot if specified (is only proto parser specific)
				requestType = removeTrailingDot(requestType);
			} else {
				packagename = determinePackageNameForMessage(requestType);
			}

			var swaggerRef = getSwaggerRefDefinition(requestType, packagename);
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
 * @param {packagename} The packagename that should be used.
 */
function appendDynamicDefinitions(messages, packagename) {
	for (var i = 0; i < messages.length; i++) {

		var messageName = packagename + messages[i].name;

		if (messages[i].messages.length > 0) {

			appendDynamicDefinitions(messages[i].messages, packagename + messages[i].name + ".");

		}

		fs.appendFileSync(output, " " + messageName + ":\n");

		// Defining empty messages (no properties)
		if (messages[i].fields.length === 0) {
			fs.appendFileSync(output, "   type: object\n");
		} else {
			fs.appendFileSync(output, "  properties:\n");
		}

		for (var j = 0; j < messages[i].fields.length; j++) {
			var rule = messages[i].fields[j].rule;
			var type = messages[i].fields[j].type;
			var fieldName = messages[i].fields[j].name;
			var options = messages[i].fields[j].options;
			var id = messages[i].fields[j].id;
			fs.appendFileSync(output, "   " + fieldName + ":\n");
			// Special case because maps are currently not supported by swagger
			if (rule == "map" || rule == "repeated") {
				appendMapArrayDefinition(type, packagename);
			} else if (isPrimitiveDataType(type)) {
				fs.appendFileSync(output, "    type: " + convertDataTypeProto3ToSwagger(type) +
					"\n");
			} else {

				if(isNestedField(messages[i], type)){
					fs.appendFileSync(output, "    " + getSwaggerRefDefinition(type, packagename + messages[i].name + ".") + "\n");
				}else{
					fs.appendFileSync(output, "    " + getSwaggerRefDefinition(type, packagename) + "\n");

				}
			}
		}
	}
}

/**
 * Appends the enum definitions for the given Array of enums.
 * @param {enums} Array containing all enums of the given parsed
 * proto object for which a definition should be added.
 * @param {packagename} The packagename that should be used.
 */
function appendEnumDefinitions(enums, packagename) {
	for (var i = 0; i < enums.length; i++) {

		var enumName = packagename + enums[i].name;

		fs.appendFileSync(output, " " + enumName + ":\n");
		fs.appendFileSync(output, "  type: string\n");
		fs.appendFileSync(output, "  enum: [");
		for (var j = 0; j < enums[i].values.length; j++) {
			var valueName = enums[i].values[j].name;
			fs.appendFileSync(output, "\"" + valueName + "\"");

			if (j < enums[i].values.length - 1) {
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
	} else if (protoType === "uint32") {
		return "integer";
	} else if (protoType === "uint64") {
		return "integer";
	} else if (protoType === "sint32") {
		return "integer";
	} else if (protoType === "sint64") {
		return "integer";
	} else if (protoType === "fixed32") {
		return "integer";
	} else if (protoType === "fixed64") {
		return "integer";
	} else if (protoType === "sfixed32") {
		return "integer";
	} else if (protoType === "sfixed64") {
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
		protoType === "uint32" || protoType === "uint64" ||
		protoType === "sint32" || protoType === "sint64" ||
		protoType === "fixed32" || protoType === "fixed64" ||
		protoType === "sfixed32" || protoType === "sfixed64" ||
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
 * @param {packagename} The packagename that should be used.
 * @return The reference string for the given swagger data type.
 */
function getSwaggerRefDefinition(dataType, packagename) {
	return "$ref: \"#/definitions/" + packagename + dataType + "\"";
}

/**
 * Appends the map and array definitions (if it was map or repeated in proto3).
 * @param {type} The type of the items within.
 * @param {packagename} The packagename that should be used.
 */
function appendMapArrayDefinition(type, packagename) {
	fs.appendFileSync(output, "    type: array\n");
	fs.appendFileSync(output, "    items:\n");
	if (isPrimitiveDataType(type)) {
		fs.appendFileSync(output, "     type: " +
			convertDataTypeProto3ToSwagger(type) + "\n");
	} else {
		fs.appendFileSync(output, "     " + getSwaggerRefDefinition(type, packagename) + "\n");
	}
}

/**
 * Determines the packagename for a given message name. Will (similar to the behaviour
 * of protobufjs) start with the inner-most proto file and searches all proto files until
 * the first occurence of the specified message name.
 * @param {messageName} The name of the message for which the package name should be determined.
 * @return {packagename} The according packagename. Empty string if not found.
 */
function determinePackageNameForMessage(messageName) {

	var packagename = null;
	var foundIt = false;
	// Choose the first message found (local, then imported)
	for (var i = 0; i < protoObjects.length; i++) {
		if (!foundIt) {
			for (var j = 0; j < protoObjects[i].messages.length; j++) {

				if (protoObjects[i].messages[j].name === messageName) {
					packagename = protoObjects[i].package;
					foundIt = true;
					break;
				}
			}
		}
	}

	if (packagename === null || packagename === "undefined") {
		packagename = "";
	} else {
		packagename += ".";
	}

	return packagename;
}

/**
* Determines whether the given field name is a nested one of the given message.
* @param {message} The message.
* @param {fieldName} The name of the field.
*/
function isNestedField(message, fieldName){

	for(var i=0;i<message.messages.length;i++){
		if(fieldName === message.messages[i].name){
			return true;
		}
	}
	for (var j=0;j<message.enums.length;j++){
		if(fieldName === message.enums[j].name){
			return true;
		}
	}
	return false;
}

/**
 * Removed a trailing dot for a given string.
 * @param {str} The string for which a trailing dot should be removed.
 * @ return {str} The input string without trailing dot.
 */
function removeTrailingDot(str) {
	if (str[0] === ".") {
		str = str.slice(1);
	}
	return str;
}
