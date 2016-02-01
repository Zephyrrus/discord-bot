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

function databaseHandler(moduleName) {
    this.databaseConInstance = new databaseCon();
    this.databaseName = moduleName;
    this.database = this.databaseConInstance.getDatabase();
}

//Best comment ever, but I will understand what it does
/*well, it gets a structure object which is like this
"databaseStructure": [
        {name: "id", type: "autonumber", primaryKey: true},
        {name: "uid", type: "number"},
        {name: "reason", type: "string"},
        {name: "addedDate", type: "datetime"},
        {name: "addedBy", type: "number"}
      ]
 and the params is like
[{paramName: "id",  value:"0"}, {paramName: "reason", value:"benobestmod"}]
*/

databaseHandler.prototype.add = function(moduleName, structure, params, callback) {
    callback = callback || () => {};

    var receivedParams = [];
    var receivedStructure = [];
    var requiredParamsCount = 0;
    var requiredParamsSentCount = 0;
    var questionMarks = "";
    var paramsToInsert = "";

    var database = this.database;
    createTable(moduleName, structure, this.database, function(err, res){
      if(err === null){
        // prepares the parameters based on the structure and removes parameters which are not defined in the structure
        // check if every REQUIRED parameter is sent
        for (var i = 0; i < structure.length; i++) {
            if (structure[i].required != undefined && structure[i].required == true) requiredParamsCount++; // check the structure for every required paramater

            for (var k = 0; k < params.length; k++) {
                if (structure[i].name == params[k].name) {
                    receivedStructure.push(structure[i].name);
                    receivedParams.push(params[k].value);
                    if (structure[i].required != undefined && structure[i].required == true) requiredParamsSentCount++; // we found a required parameter, increment the counter

                }
            }
        }


        if (receivedParams.length == 0) return callback(3, null); // this happens if no correct parametes were received
        if (requiredParamsSentCount < requiredParamsCount) return callback(1, null); // you forgot to send several of the required parametes

        for (var i = 0; i < receivedParams.length; i++) {
            receivedStructure.push(receivedParams[i]);
            if (i + 1 == receivedParams.length) {
                questionMarks += "?";
                paramsToInsert += receivedStructure[i].toString();
            } else {
                questionMarks += "?,";
                paramsToInsert += receivedStructure[i].toString() + ",";
            }
        }


        logger.debug("[SQLITE]_DEBUG: INSERT INTO " + moduleName + "(" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams);
        database.run("INSERT INTO " + moduleName + " (" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams, function(err) {
            if(err != null){
              logger.error("[SQLITE_ERROR]_INSERT_PARAMS: " + err);
              return callback({type: "SQLITEERROR", error: err}, null);
            }
            return callback(null, null)
        });
      }else{
        return(5, null);

      }//end big if
    });


}

databaseHandler.prototype.remove = function(structure, params, condition) {

}

databaseHandler.prototype.find = function(structure, /*params, condition, */ callback) {
    callback = callback || () => {};
    var result = [];
    this.database.each("SELECT * FROM " + this.databaseName, function(err, row) {
        return callback(null, row);
    });
}

databaseHandler.prototype.customquerry = function(args) {
    var result = [];
    return result;
}

/*databaseHandler.prototype.createTable = function(moduleName, structure, callback) {

}*/

assertTypes = function(structure, params, callback) {

    //{errorCode, error}
}

getError = function(errorCode) {


}

//THIS SHOULD BE PRIVATE
createTable = function(moduleName, structure, database, callback) {
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
          return callback(err, null);
        }
        else return callback(null, null);
    });
    //return callback(null, null);
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

module.exports = databaseHandler;
