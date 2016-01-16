const Something = require('./databaseConnector.js');

function databaseHandler(moduleName) {
  this.databaseName = moduleName;
}

databaseHandler.prototype.add = function(args) {
    return db;
}

databaseHandler.prototype.remove = function(args){

}

databaseHandler.prototype.find = function(args){
  var result = [];
  return result;
}

databaseHandler.prototype.customquerry = function(args){
  var result = [];
  return result;
}
