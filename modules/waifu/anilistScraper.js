var fs = require('fs');
var http = require('follow-redirects').https;
var request = require('request');

if (GLOBAL.MODE === "production") {
  var auth = require('../../configs/auth.json'); // or remove ./ for absolute path ^_^
}
else {
  var auth = require('../../configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}

var cachedKey = null;

module.exports = {
  getAvatar: function(name, callback){
    var tokenUrl = "https://anilist.co/api/auth/access_token?grant_type=client_credentials&client_id=" + auth.anilist.client_id + "&client_secret=" + auth.anilist.client_secret;

    if(cachedKey != null && cachedKey.expire > ((new Date()).getTime()/1000)){
      console.log("Found cached API key for anilist: " + JSON.stringify(cachedKey));
      var url = "https://anilist.co/api/character/search/" + encodeURIComponent(name) + "?access_token=" + cachedKey.access_token
      getJson(url, function(err, res){
        if(err) return (callback && callback(err, null));
        try{
          var result = JSON.parse(res);
        }catch(err){
          console.log(res);
          return (callback && callback({error: "INVALID_JSON"}, null));
        }
        return (callback && callback(null, result[0]));
      });
      return;
    }

    request({url: tokenUrl, method:"POST", json:true}, function(err,res,body){
        if(err) return (callback && callback(err, null));
        if(body.access_token != undefined){
          cachedKey = {access_token: body.access_token, expire: (((new Date()).getTime()/1000) + 3600)};
          var url = "https://anilist.co/api/character/search/" + encodeURIComponent(name) + "?access_token=" + body.access_token
          getJson(url, function(err, res){
            if(err) return (callback && callback(err, null));
            try{
              var result = JSON.parse(res);
            }catch(err){
              console.log(res);
              return (callback && callback({error: "INVALID_JSON"}, null));
            }
            return (callback && callback(null, result[0]));
          });
        }else{
          console.log("NO_ACCES_TOKEN: " + res);
          return (callback && callback({error: "NO_ACCES_TOKEN"}, null));
        }
      }
    );
  }
}

function getJson(url, callback){
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
      console.log("[ANILIST] Got an error: ", {error: e});
  });
}
