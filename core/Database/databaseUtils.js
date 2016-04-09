const databaseCon = require('./databaseConnector.js');
var databaseConInstance = new databaseCon();
var logger = require("winston");

var list = function(tableName, callback) {
    database = databaseConInstance.getDatabase();
    var result = [];
    database.each("SELECT * FROM " + tableName, function(err, row) {
        if (err) {
          logger.error("[SQLITE_ERROR]_LIST: " + err);
          return (callback && callback(err));
        }
        result.push(row);
    }, function (err, cntx) {
      if (err) {
        logger.error("[SQLITE_ERROR]_LIST: " + err);
        return (callback && callback({type: "SQLITEERROR", error: err}, null));
    }
      return (callback && callback(null, {count: cntx, result: result}));
    });
}

var random = function(tableName, callback){
  database = databaseConInstance.getDatabase();
  var result = [];
  database.each("SELECT * FROM " + tableName + " WHERE random() % k = 0 LIMIT 1", function(err, row) {
      if (err) {
        logger.error("[SQLITE_ERROR]_LIST: " + err);
        return (callback && callback(err));
      }
      result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_LIST: " + err);
      return (callback && callback({type: "SQLITEERROR", error: err}, null));
  }
    return (callback && callback(null, {count: cntx, result: result}));
  });
}

module.exports = {
  list: list,
  random: random
}
