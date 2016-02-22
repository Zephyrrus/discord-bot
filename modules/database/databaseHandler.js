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
  createTable(this.moduleName, structure, this.database, function (err, res) {});
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
  if (!(params instanceof Array))
    return (callback && callback({ type: "HANDLER_ERROR_INSERT", error: "You must send the objects in an array. Please read the documentation for further information" }, null));
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
    return (callback && callback({ type: "HANDLER_ERROR_INSERT", error: "One or more required parameters are missing" }, null)); // you forgot to send several of the required parametes
  if (receivedParams.length < 1 || receivedStructure.length < 1)
    return (callback && callback({ type: "HANDLER_ERROR_INSERT", error: "Invalid or no parameters received" }, null));

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
      return (callback && callback({ type: "SQLITEERROR", error: err }, null));
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
databaseHandler.prototype.delete = function (params, callback) {
  callback = callback || () => {};
  var receivedParams = [];
  var questionMarks = "";
  var paramsToSearch = [];
  var result = [];
  if (!(params instanceof Array))
    return (callback && callback({ type: "HANDLER_ERROR_DELETE", error: "You must send the objects in an array. Please read the documentation for further information" }, null));
  for (var i = 0; i < this.structure.length; i++) {
    for (var k = 0; k < params.length; k++) {
      if (this.structure[i].name == Object.keys(params[k])) {
        receivedParams.push(params[k]);
      }
    }
  }
  if (receivedParams.length == 0) return (callback && callback({ type: "HANDLER_ERROR_DELETE", error: "Invalid or no parameters defined" }, null)); // this happens if no correct parametes were received

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
  this.database.run("DELETE FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch, function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_DELETE: " + err);
      return (callback && callback({ type: "SQLITEERROR", error: err }, null));
    } else {
      return (callback && callback(null, null));
    }
  });

}

/*
 * Updated an entry or an entire table if you're stupid and forget to set a where (this is a feature)
 *
 * @input params: This is an array of object used for querring, it should look like this `[{"rownameToSearch":"valueToSearch"}]`
 * @input update: This is an array of object what will be updated, it should look like this `[{"rowName": "newValue"}]`
 * @input CB
 *
 */
databaseHandler.prototype.update = function (querryParams, updateParams, callback) {
  var callback = callback || () => {};
  var receivedQuerry = [];
  var questionMarks = "";
  var paramsToSearch = [];
  var result = [];
  var receivedUpdateParams = [];
  var receivedStructure = [];
  var updateRowNames = "";
  var finalParams = [];
  if (!(querryParams instanceof Array) || !(updateParams instanceof Array))
    return (callback && callback({ type: "HANDLER_ERROR_UPDATE", error: "You must send the objects in an array. Please read the documentation for further information" }, null));
  for (var i = 0; i < this.structure.length; i++) {
    for (var k = 0; k < updateParams.length; k++) {
      var keyName = Object.keys(updateParams[k])[0];
      if (this.structure[i].name == keyName) {
        receivedStructure.push(this.structure[i].name);
        receivedUpdateParams.push(updateParams[k][keyName]);
      }
    }
  }
  if (receivedUpdateParams.length < 1 || receivedStructure.length < 1)
    return (callback && callback({ type: "HANDLER_ERROR_UPDATE", error: "Invalid or no parameters received" }, null));

  for (var i = 0; i < this.structure.length; i++) {
    for (var k = 0; k < querryParams.length; k++) {
      if (this.structure[i].name == Object.keys(querryParams[k])) {
        receivedQuerry.push(querryParams[k]);
      }
    }
  }

  for (var i = 0; i < receivedUpdateParams.length; i++) {
    if (i + 1 == receivedUpdateParams.length) {
      updateRowNames += receivedStructure[i] + "=?";
    } else {
      updateRowNames += receivedStructure[i] + "=?, ";
    }
    finalParams.push(receivedUpdateParams[i]);
  }

  if (receivedQuerry.length > 0) {
    for (var i = 0; i < receivedQuerry.length; i++) {
      if (i + 1 == receivedQuerry.length) {
        questionMarks += Object.keys(receivedQuerry[i]) + "=?";
      } else {
        questionMarks += Object.keys(receivedQuerry[i]) + "=? AND ";
      }
      finalParams.push(receivedQuerry[i][Object.keys(receivedQuerry[i])].toString());
    }

    logger.debug("UPDATE " + this.moduleName + " SET " + updateRowNames + " WHERE " + questionMarks, finalParams);
    this.database.run("UPDATE " + this.moduleName + " SET " + updateRowNames + " WHERE " + questionMarks, finalParams, function (err, row) {
      if (err) {
        logger.error("[SQLITE_ERROR]_UPDATE: " + err);
        return (callback && callback({ type: "SQLITEERROR", error: err }, null));
      } else {
        return (callback && callback(null, null));
      }
    });
    /*console.log(receivedQuerry);
    console.log(updateRowNames);
    console.log(questionMarks);
    console.log(finalParams);
    console.log(receivedQuerry);*/
    return; //pack up boys, we're done here
  }

  logger.debug("UPDATE " + this.moduleName + " SET " + updateRowNames, finalParams);
  this.database.run("UPDATE " + this.moduleName + " SET " + updateRowNames, finalParams, function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_UPDATE: " + err);
      return (callback && callback({ type: "SQLITEERROR", error: err }, null));
    } else {
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
databaseHandler.prototype.find = function (params, callback) {
  callback = callback || () => {};
  receivedParams = [];
  questionMarks = "";
  paramsToSearch = [];
  result = [];
  if (!(params instanceof Array))
    return (callback && callback({ type: "HANDLER_ERROR_FIND", error: "You must send the objects in an array. Please read the documentation for further information" }, null));
  for (var i = 0; i < this.structure.length; i++) {
    for (var k = 0; k < params.length; k++) {
      if (this.structure[i].name == Object.keys(params[k])) {
        receivedParams.push(params[k]);
      }
    }
  }
  if (receivedParams.length == 0) return (callback && callback({ type: "HANDLER_ERROR_FIND", error: "Invalid or no parameters defined" }, null)); // this happens if no correct parametes were received

  for (var i = 0; i < receivedParams.length; i++) {
    if (i + 1 == receivedParams.length) {
      questionMarks += Object.keys(receivedParams[i]) + "=?";
    } else {
      questionMarks += Object.keys(receivedParams[i]) + "=? AND ";
    }
    if (receivedParams[i][Object.keys(receivedParams[i])]) paramsToSearch.push(receivedParams[i][Object.keys(receivedParams[i])].toString());
  }

  logger.debug("SELECT * FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch);
  this.database.each("SELECT * FROM " + this.moduleName + " WHERE " + questionMarks, paramsToSearch, function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_SELECT_WUERRY: " + err);
      return (callback && callback({ type: "SQLITEERROR", error: err }, null));
    }
    result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_SELECT_WUERRY_END: " + err);
      return (callback && callback({ type: "SQLITEERROR", error: err }, null));
    }
    return (callback && callback(null, { count: cntx, result: result }));
  });
}

//READ ONLY QUERRIES
/*
 * Helper function if you want to get everything from the database
 * @CB output: Return an object which looks like `{count: countOfObjects, result: [{}]}` or error if an error happened
 *
 */
databaseHandler.prototype.list = function (callback) {
  callback = callback || () => {};
  var result = [];
  this.database.each("SELECT * FROM " + this.moduleName, function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_LIST: " + err);
      return (callback(err));
    }
    result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_LIST: " + err);
      return (callback({ type: "SQLITEERROR", error: err }, null));
    }
    return (callback(null, { count: cntx, result: result }));
  });
}


databaseHandler.prototype.random = function (callback) {
  var result = [];
  this.database.each("SELECT * FROM " + this.moduleName + " ORDER BY random() LIMIT 1;", function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_RANDOM: " + err);
      return (callback && callback(err));
    }
    result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_RANDOM: " + err);
      return (callback && callback({ type: "SQLITEERROR", error: err.stack }, null));
    }
    return (callback && callback(null, { count: cntx, result: result }));
  });
}


databaseHandler.prototype.top = function (topObject, columnName, callback) {
  var sortBy = "DESC";
  var limit = 10;
  if (typeof topObject === "object") {
    if (topObject.sortBy && (topObject.sortBy.toLowerCase() === "ASC" || topObject.sortBy.toLowerCase() === "DESC")) {
      sortBy = sortBy.topObject.toUpperCase();
    };
    if (topObject.limit && !isNaN(parseInt(topObject.limit))) {
      limit = parseInt(topObject.limit);
    }

  } else {
    var parsedObject = parseInt(topObject);
    if (!isNaN(parsedObject)) {
      limit = 10;
    } else if (parsedObject.toString == topObject)
      limit = parsedObject;
  }
  var valid = false;
  for (var i = 0; i < this.structure.length; i++) {
    if (this.structure[i].name == columnName) {
      valid = true;
    }
  }
  if (!valid) return (callback && callback({ type: "HANDLER_ERROR_TOP", error: "No column with that name." }, null));

  var result = [];
  this.database.each(`SELECT * FROM ${this.moduleName} ORDER BY ${columnName} ${sortBy} LIMIT ${limit};`, function (err, row) {
    if (err) {
      logger.error("[SQLITE_ERROR]_TOP: " + err);
      return (callback && callback(err));
    }
    result.push(row);
  }, function (err, cntx) {
    if (err) {
      logger.error("[SQLITE_ERROR]_TOP: " + err);
      return (callback && callback({
        type: "SQLITEERROR",
        error: err.stack
      }, null));
    }
    return (callback && callback(null, { count: cntx, result: result }));
  });
}

databaseHandler.prototype.count = function (columnName, callback) {
  var valid = false;
  for (var i = 0; i < this.structure.length; i++) {
    if (this.structure[i].name == columnName) {
      valid = true;
    }
  }
  if (!valid) return (callback && callback({ type: "HANDLER_ERROR_COUNT", error: "No column with that name." }, null));

  this.database.each(`SELECT count(${columnName}) FROM ${this.moduleName};`, function (err, result) {
    if (err) {
      logger.error("[SQLITE_ERROR]_COUNT: " + err);
      return (callback && callback(err));
    }
    console.log(result);
    return (callback && callback(null, result['count(' + columnName + ')']))
  });
}

//Private functions
createTable = function (moduleName, structure, database, callback) {
  database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='" + moduleName + "'", function (err, row) {
    if (row === undefined) {
      var names = "";
      // there's a bug in this, if the last one is undefined it will still add a ',', gonna write a preparer function for this.
      for (var i = 0; i < structure.length; i++) {
        if (structure[i].name != undefined) {
          if (structure[i].type != undefined && getType(structure[i].type) != undefined) {
            if (i + 1 == structure.length) {
              names += structure[i].name + " " + getType(structure[i].type) + " " + (structure[i].primaryKey == undefined ? "" : "PRIMARY KEY");
            } else {
              names += structure[i].name + " " + getType(structure[i].type) + " " + (structure[i].primaryKey == undefined ? "" : "PRIMARY KEY") + ", ";
            }
          }
        }
      }

      logger.debug("[SQLITE]_DEBUG: " + "CREATE TABLE if not exists " + moduleName + " (" + names + ")");
      database.run("CREATE TABLE if not exists " + moduleName + " (" + names + ")", function (err) {
        if (err != null) {
          logger.error("[SQLITE_ERROR]_CREATE_TABLE: " + err);
          callback(err, null);
        } else callback(null, null);
      });
    }
  });
}


getType = function (typeName) {
  switch (typeName.toLowerCase()) {
  case "number":
  case "int":
  case "autonumber":
  case "integer":
    return "INTEGER";
    break;
  case "string":
  case "test":
  case "datetime":
    return "TEXT";
    break;
  default:
    return "TEXT";
    break;
  }
}

//NOT IMPLEMENTANDO
validateParameters = function (structure, params, callback) {
  callback = callback || () => {};
}

module.exports = databaseHandler;
