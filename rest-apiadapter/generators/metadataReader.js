"use strict";
/**
 * Reads the metadata from metadata file.
 * author: Tobias Freundorfer (https://github.com/tfreundo)
 */
var fs = require("fs");

/**
 * Reads the given metadata file.
 * @param {file} The path to the metadata.json file that should be used.
 * @return {metadata} The metadata object or 'undefined' if error when parsing.
 */
module.exports.readMetadata = function(file) {
	console.log("### Metadata Reader ###\n");
	console.log("Reading file: " + file);

	try {
		// Check if file exists (throws if not existing)
		fs.accessSync(file, fs.F_OK);

		// File exists, so start parsing
		var metadataFile = require(file);
		console.log("Found title: " + metadataFile.title);
		console.log("Found version: " + metadataFile.version);

		return metadataFile;

	} catch (err) {
		console.log("Error when reading file: \n" + err.message);
		return "undefined";
	}

}
