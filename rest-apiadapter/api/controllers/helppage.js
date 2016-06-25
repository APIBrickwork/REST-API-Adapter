var fs = require("fs");

exports.getPage = function (req, res) {
	fs.readFile('./html/inline-index.html', function (err, html) {
		if (err) {
			console.log(err);
      // TODO: Returns a static help page?!?!
		}
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(html);
		res.end();
	});
}
