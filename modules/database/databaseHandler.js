const databaseCon = require('./databaseConnector.js');

/*
 * -1 - SQLite3 error happened, check console for full log
 * 0  - Operation finished with success
 * 1  - Number of sent params is smaller than the number of required params
 * 2  - No correct parameters received
 * 3
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
[{paramName: "id",  value:"0"}, {paramName: "kappa", value:"benobestmod"}]
*/

databaseHandler.prototype.add = function(moduleName, structure, params, callback) {
    //INSERT INTO TABLE_NAME (column1, column2, column3,...columnN)] VALUES (value1, value2, value3,...valueN);
    /*

    */
    var receivedParams = [];
    var receivedStructure = [];
    var requiredParamsCount = 0;
    var requiredParamsSentCount = 0;
    var questionMarks = "";
    var paramsToInsert = "";
    //receivedStructure.push(moduleName);
    //this.database.run("CREATE TABLE if not exists " + moduleName +" (id INT, reason TEXT)");

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


    if (receivedParams.length == 0) return 3; // this happens if no correct parametes were received
    if (requiredParamsSentCount < requiredParamsCount) return 1; // you forgot to send several of the required parametes
    //console.log(requiredParamsCount + " " + requiredParamsSentCount)
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


    console.log("INSERT INTO " + moduleName + "(" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams);
    this.database.run("INSERT INTO " + moduleName + "(" + paramsToInsert + ") VALUES (" + questionMarks + ")", receivedParams, function(err) {
        console.log(err);
    });
    return 0;
}

databaseHandler.prototype.remove = function(structure, params, condition) {

}

databaseHandler.prototype.find = function(structure, params, condition) {
    var result = [];
    this.database.each("SELECT * FROM " + moduleName, function(err, row) {
        return row;
    });

}

databaseHandler.prototype.customquerry = function(args) {
    var result = [];
    return result;
}

databaseHandler.prototype.createDatabase = function(moduleName, structure, callback) {

}

module.exports = databaseHandler;
