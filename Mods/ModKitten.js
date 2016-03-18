var fs = require('fs');
var http = require('follow-redirects').http;
var request = require('request');

function doKitten(e, args) {
  e.deleteMessage();
  http.get("http://thecatapi.com/api/images/get", function (res) {
    var body = '';

    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      var link = res.fetchedUrls[0].replace(/^https:\/\//i, 'http://');
      var filename = link.split("/").pop();
      request(link.toString(), {encoding: null}, function(err, res, body) {
        e.mention().respond("**Nyaa~** \u2764", function(err, res){
          e._disco.bot.uploadFile({
              to: e.channelID,
              file: body,
              filename: filename
          });
        })//.respondFile(body);
    });
    });
  }).on('error', function (e) {
    console.log("[Kitten] Got an error: ", e);
  });


}

module.exports = {
  "MODULE_HEADER":{
    moduleName: "Kitten poster",
    version: "1.1.2",
    author: "Zephy",
    description: "random kitten poster",
  },
  "kitten": {
    permission: "kitten",
    helpMessage: "your daily dose of cute kittens",
    category: "Entertainment",
    handler: doKitten,
    cooldown: 5000
  }
}
