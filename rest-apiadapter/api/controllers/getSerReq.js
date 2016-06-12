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
    res.end(serReq);
  }
  else{
    console.log("Couldn't find it.");
    res.end("Could not find ServiceRequest with id = " + id);
  }
}
