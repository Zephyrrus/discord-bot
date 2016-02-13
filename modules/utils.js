var http = require('follow-redirects').http;
var https = require('follow-redirects').https;

module.exports = {
  getJSONHTTP: getJSONHTTP,
  getJSONHTTPS: getJSONHTTPS
}

function getJSONHTTP(url, callback){
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });
    res.on('end', function(){
        return (callback && callback(null, body));
    });
  }).on('error', function(e){
    return (callback && callback(e, null));
      console.log("[getJson] Got an error: ", {error: e});
  });
}

function getJSONHTTPS(url, callback){
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });
    res.on('end', function(){
        return (callback && callback(null, body));
    });
  }).on('error', function(e){
    return (callback && callback(e, null));
      console.log("[getJson] Got an error: ", {error: e});
  });
}
