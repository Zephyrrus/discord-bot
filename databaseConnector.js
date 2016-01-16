var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

function databaseConnector() {

}

databaseConnector.prototype.getTheThing = function() {
    return db;
}

module.exports = databaseConnector;
