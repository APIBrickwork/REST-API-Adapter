var low = require("lowdb");
const db = low('../rest-storage/serviceRequestsDb.json', { storage: require('lowdb/lib/file-async') });

module.exports = {
  getSerReq: getSerReq
};

function getSerReq(req, res){

  var id = req.swagger.params.id.value;
  console.log("Seeking ServiceRequest with id = " + id);

  db.read();
  if(db.has(id).value()){
    console.log("Found it.");
    var serReq = db.get(id).value();
    res.json(serReq);
  }
  else{
    console.log("Couldn't find it.");
    // TODO: Evaluate if this is the right way to do this. Maybe add error msg??re
    var notFound = "Not found.";
    var emptyJson = {
      service: notFound,
      status: notFound,
      output: ""
    };
    var jsonRes = JSON.parse(emptyJson);
    res.json(jsonRes);
  }
}
