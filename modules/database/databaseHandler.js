const databaseCon = require('./databaseConnector.js');
var logger = require("winston");
/*
 * -1 - SQLite3 error happened, check console for full log
 * 0  - Operation finished with success
 * 1  - Number of sent params is smaller than the number of required params
 * 2  - No correct parameters received
 * 3  - Received params assert failed
 * 4  - Database structure assert failed
 * 5  - Database creation failed
 */

/*
 *
 * databaseConInstance = Gets a cached database connector from the databaseConnector class
 * moduleName = the name of the table (it's called module name because eveyr module has a single table)
 * database = An opened database from the databaseConnector
 * when a new databaseHandler is made, it will check if the table already exists or create a new one if it doesn't exists
 *
 */
function databaseHandler(moduleName, structure) {
    this.databaseConInstance = new databaseCon();
    this.moduleName = moduleName;
    this.database = this.databaseConInstance.getDatabase();
    this.structure = structure;
    createTable(this.moduleName, structure, this.database, function(err, res){});
}

/*
 * Adds something to the database.
 *
 * @input params: This is an array of object what you want to insert into the db `[{"rowName": "value"}]`
 * @input CB
 * @CB output: Return null, null on succes or the error if something went wrong
 *
 */
databaseHandler.prototype.add = function (params, callback) {
    callback = callback || () => {};

    var receivedParams = [];
    var receivedStructure = [];
    var requiredParamsCount = 0;
    var requiredParamsSentCount = 0;
    var questionMarks = "";
    var paramsToInsert = "";
    var self = this;
    // prepares the parameters based on the this.structure and removes parameters which are not defined in the this.structure
    // check if every REQUIRED parameter is sent
    for (var i = 0; i < this.structure.length; i++) {
        if (this.structure[i].required != undefined && this.structure[i].required == true) requiredParamsCount++; // check the this.structure for every required paramater
        for (var k = 0; k < params.length; k++) {
            var keyName = Object.keys(params[k])[0];
            if (this.structure[i].name == keyName) {
                receivedStructure.push(this.structure[i].name);
                receivedParams.push(params[k][keyName]);
                if (this.structure[i].required != undefined && this.structure[i].required == true) requiredParamsSentCount++; // we found a required parameter, increment the counter
            }
        }
    }

    if (requiredParamsSentCount < requiredParamsCount)
        return (callback && callback({type: "HANDLER_ERROR_INSERT",error: "One or more required parameters are missing"}, null)); // you forgot to send several of the required parametes
    if (receivedParams.length < 1 || receivedStructure.length < 1)
        return (callback && callback({type: "HANDLER_ERROR_INSERT",error: "Invalid or no parameters received"}, null));

    for (var i = 0; i < receivedParams.length; i++) {
        if (i + 1 == receivedParams.length) {
            questionMarks += "?";
            paramsToInsert += receivedStructure[i].toString();
        } else {
            questionMarks += "?,";
            paramsToInsert += receivedStructure[i].toString() + ",";
        }
    }


    logger.debug("[SQLITE]_DEBUG: INSERT INTO " + this.moduleName + "(" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams);
    this.database.run("INSERT INTO " + this.moduleName + " (" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams, function (err) {
        if (err != null) {
            logger.error("[SQLITE_ERROR]_INSERT_PARAMS: " + err);
            return (callback && callback({type: "SQLITEERROR",error: err}, null));
        }
        return (callback && callback(null, null))
    });

}

/*
 * Deletes something from the database and returns the status of the function.
 *
 * @input params: This is an array of object used for querring, it should look like this `[{"rownameToSearch": "whatRowShouldEqual"}]`
 * @input CB
 *
 */
databaseHandler.prototype.delete = function(params, callback){
  callback = callback || () => {};
  receivedParams = [];
  questionMarks = "";
  paramsToSearch = [];
  result = [];

  for (var i = 0; i < this.structure.length; i++) {
      for (var k = 0; k < params.length; k++) {
          if (this.structure[i].name == Object.keys(params[k])) {
              receivedParams.push(params[k]);
          }
      }
  }
  if (receivedParams.length == 0) return (callback && callback({type: "HANDLER_ERROR_DELETE", error: "Invalid or no parameters defined"}, null)); // this happens if no correct parametes were received

  for (var i = 0; i < receivedParams.length; i++) {
      if (i + 1 == receivedParams.length) {
          questionMarks += Object.keys(receivedParams[i]) + "=?";
      } else {
          questionMarks += Object.keys(receivedParams[i]) + "=? AND ";
      }
      paramsToSearch.push(receivedParams[i][Object.keys(receivedParams[i])].toString());
  }

  console.log(receivedParams);
  logger.debug("DELETE FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch);
  this.database.run("DELETE FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch, function(err, row) {
      if(err){
        logger.error("[SQLITE_ERROR]_DELETE: " + err);
        return (callback && callback({type: "SQLITEERROR", error: err}, null));
      }else{
        return (callback && callback(null, null));
      }
    });

}

/*
 * Searches for something in the database and returns an object with the results from the db
 *
 * @input params: This is an array of object used for querring, it should look like this `[{"rownameToSearch": "whatRowShouldEqual"}]`
 * @input CB
 * @CB output: Return an object which looks like `{count: countOfObjects, result: [{}]}` or error if an error happened
 *
 */
databaseHandler.prototype.find = function(params, callback){
  callback = callback || () => {};
  receivedParams = [];
  questionMarks = "";
  paramsToSearch = [];
  result = [];

  for (var i = 0; i < this.structure.length; i++) {
      for (var k = 0; k < params.length; k++) {
          if (this.structure[i].name == Object.keys(params[k])) {
              receivedParams.push(params[k]);
          }
      }
  }
  if (receivedParams.length == 0) return (callback && callback({type: "HANDLER_ERROR_FIND", error: "Invalid or no parameters defined"}, null)); // this happens if no correct parametes were received

  for (var i = 0; i < receivedParams.length; i++) {
      if (i + 1 == receivedParams.length) {
          questionMarks += Object.keys(receivedParams[i]) + "=?";
      } else {
          questionMarks += Object.keys(receivedParams[i]) + "=? AND ";
      }
      if(receivedParams[i][Object.keys(receivedParams[i])]) paramsToSearch.push(receivedParams[i][Object.keys(receivedParams[i])].toString());
  }

  logger.debug("SELECT * FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch);
  this.database.each("SELECT * FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch, function(err, row) {
      if(err){
        logger.error("[SQLITE_ERROR]_SELECT_WUERRY: " + err);
        return (callback && callback({type: "SQLITEERROR", error: err}, null));
      }
      result.push(row);
  }, function (err, cntx) {
      if (err) {
        logger.error("[SQLITE_ERROR]_SELECT_WUERRY_END: " + err);
        return (callback && callback({type: "SQLITEERROR", error: err}, null));
      }
      return (callback && callback(null, {count: cntx, result: result}));
  });
}

//READ ONLY QUERRIES
/*
 * Helper function if you want to get everything from the database
 * @CB output: Return an object which looks like `{count: countOfObjects, result: [{}]}` or error if an error happened
 *
 */
databaseHandler.prototype.list = function(callback) {
    callback = callback || () => {};
    var result = [];
    this.database.each("SELECT * FROM " + this.moduleName, function(err, row) {
        if (err) {
          logger.error("[SQLITE_ERROR]_LIST: " + err);
          return (callback(err));
        }
        result.push(row);
    }, function (err, cntx) {
      if (err) {
        logger.error("[SQLITE_ERROR]_LIST: " + err);
        return (callback({type: "SQLITEERROR", error: err}, null));
    }
      return (callback(null, {count: cntx, result: result}));
    });
}


databaseHandler.prototype.random = function(callback) {
  var result = [];
  this.database.each("SELECT * FROM " + this.moduleName + " ORDER BY random() LIMIT 1;", function(err, row) {
      if (err) {
        logger.error("[SQLITE_ERROR]_RANDOM: " + err);
        return (callback && callback(err));
      }
      result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_RANDOM: " + err);
      return (callback && callback({type: "SQLITEERROR", error: err.stack}, null));
  }
    return (callback && callback(null, {count: cntx, result: result}));
  });
}


//Private functions
createTable = function(moduleName, structure, database, callback) {
  database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='" + moduleName + "'", function(err, row) {
    if (row === undefined) {
      var names = "";
      // there's a bug in this, if the last one is undefined it will still add a ',', gonna write a preparer function for this.
      for (var i = 0; i < structure.length; i++) {
          if (structure[i].name != undefined) {
              if (structure[i].type != undefined && getType(structure[i].type) != undefined) {
                if (i + 1 == structure.length) {
                    names += structure[i].name + " " + getType(structure[i].type) + " " + (structure[i].primaryKey == undefined ? "": "PRIMARY KEY");
                } else {
                    names += structure[i].name + " " + getType(structure[i].type) + " " + (structure[i].primaryKey == undefined ? "": "PRIMARY KEY") + ", ";
                }
              }
          }
      }

      logger.debug("[SQLITE]_DEBUG: " + "CREATE TABLE if not exists " + moduleName + " ("+ names + ")");
      database.run("CREATE TABLE if not exists " + moduleName + " ("+ names + ")", function(err) {
          if (err != null) {
            logger.error("[SQLITE_ERROR]_CREATE_TABLE: " + err);
            callback(err, null);
          }
          else callback(null, null);
      });
    }
  });
}

getType = function(typeName) {
    switch (typeName.toLowerCase()) {
        case "number":
        case "int":
        case "autonumber":
            return "INTEGER";
            break;
        case "string":
        case "test":
        case "datetime":
            return "TEXT";
            break;
        default:
            return undefined;
            break;
    }
}

//NOT IMPLEMENTANDO
validateParameters = function(structure, params, callback){
  callback = callback || () => {};
}

module.exports = databaseHandler;
