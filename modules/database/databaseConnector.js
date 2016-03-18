var sqlite3 = require('sqlite3'); //DON'T FORGET TO DISABLE VERBOSE IN PRODUCTION
var db = new sqlite3.Database('database.db');

function databaseConnector() {

}

databaseConnector.prototype.getDatabase = function() {
    return db;
}

module.exports = databaseConnector;
