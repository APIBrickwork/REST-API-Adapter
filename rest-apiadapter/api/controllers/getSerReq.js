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
    var jsonRes = JSON.parse(serReq);
    res.json(jsonRes);
  }
  else{
    console.log("Couldn't find it.");
    var emptyJson = {};
    var jsonRes = JSON.parse(emptyJson);
    res.json(jsonRes);
  }
}
