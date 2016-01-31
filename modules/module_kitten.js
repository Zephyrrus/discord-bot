var fs = require('fs');
var http = require('follow-redirects').http;

function doKitten(args, e) {
  e.bot.deleteMessage({
    channel: e.channelID,
    messageID: e.rawEvent.d.id
  });
  http.get("http://thecatapi.com/api/images/get", function(res) {
    var body = '';

    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      var link = res.fetchedUrls[0].replace(/^https:\/\//i, 'http://');
      var filename = "./modules/cache/" + link.split("/").pop();
      var file = fs.createWriteStream(filename);
      var request = http.get(link.toString(), function(response) {
        response.pipe(file);
      });
      request.on('close', function() {
        fs.exists(filename, function(exists) {
          if (exists) {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> **Nyaa~** \u2764",
            }, function(response) {
              e.bot.uploadFile({
                to: e.channelID,
                file: fs.createReadStream(filename)
              }, function(response) {
                fs.unlink(filename);
              });
            });
          }
        });
      });
    });
  }).on('error', function(e) {
    console.log("[Kitten] Got an error: ", e);
  });


}

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "random kitten poster",
      "author": "Zephy",
      "version": "1.0.0",
      "importance": "addon",
      "name": "Kitten poster",
      "moduleName": "kitten"
    },
    "requiresDB": false
  },
  lastTime: 0,
  cooldown: 5000,
  category: "entertainment",
  description: "kitten - your daily dose of random kittens",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    doKitten(args, e);
  }
};
