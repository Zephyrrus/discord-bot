//-1-requires aditional secret key
//0-valid, has permission
//1-valid, no permissions
//2-invalid key, null
//3-banned key, null
//4-expired key, null
//5-rate limited key, null
var apiKeys = require('./apiKeys.json');

function validateKey(key, scope, callback) {
  return 0;

}

function addKey(username, scope, callback) {

}

function banKey(key, reason) {

}

function deleteKey(key) {


}

function logKeyUsage(key, scope, params, callback) {


}

function generateKey(salt) {
  var base = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!";
  var keyLen = 64;
  var key = "";
  for (var i = 0; i < keyLen; i++)
    key += base.charAt(Math.floor(Math.random() * base.length));
  return key;
}

module.exports = {
	validateKey: validateKey
}
