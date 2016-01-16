var fs = require('fs');
var http = require('follow-redirects').https;
if (GLOBAL.MODE === "production") {
  var auth = require('../configs/auth.json'); // or remove ./ for absolute path ^_^
}
else {
  var auth = require('../configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}

module.exports = {
  gettitlefromid: function(id, callback){
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + id + "&key=" + auth.google.apikey;
    http.get(url, function(res){
      var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });
      res.on('end', function(){
          var response = JSON.parse(body);
          if(response.items[0] != undefined)
            return callback(response.items[0].snippet.localized.title);
          else
            return callback(undefined);
      });
  }).on('error', function(e){
        console.log("[Youtube] Got an error: ", e);
  });

  }
}
