var fs = require('fs');
var http = require('follow-redirects').https;
var request = require('request');

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "searches for tags on e621",
      "author": "Zephy",
      "version": "1.0.2",
      "importance": "addon",
      "name": "e621 scrapper",
      "moduleName": "e621"
    },
    "requiresDB": false,
  },
  category: "anime",
  description: "e621 <tags> - Searches for those tags on e621",
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  action: function (args, e) {
    if (args[0] == "") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> No character name"
      });
      return
    }
    var final = args.join(" ");
    e621Grab(e, final);
  }
}

function getJson(url, callback) {
  var headers = {
      'User-Agent':       'Raylen discord chat client.',
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: url,
      method: 'GET',
      headers: headers,
      json: true
  }

  request(options, function (err, res, body) {
    if(err) return (callback && callback(err, null));
    if (!err && res.statusCode == 200) {
        return (callback && callback(null, body));
    }
    console.log(">>>e621 Not 200 response: " + res.statusCode)
    return (callback && callback("Not 200 response", null));
  });
}

function e621Grab(e, args) {
  //var tags = args.replace(/ +/gi, "+");
  var tags = args;
  if(!e.nsfwEnabled) var tags = tags.replace(/(\+|-)?rating:\w*/gi, '') + " rating:s"
    var url = "https://e621.net/post/index.json?tags=" + encodeURIComponent(tags)
    getJson(url, function (err, res) {
      if (err) return (e.logger.error("[e621]_SCRAPE_ERROR: " + err));
        if(res && res[0]){
          var random = res[randomInt(0, res.length)];
          console.log(">>> Choosen random: " + JSON.stringify(random, null, '\t'));
          var str = "I found a match for the tags **" + args + "**:\n";

          e.bot.sendMessage({
            to: e.channelID,
            message: str + "Permalink: \"https://e621.net/post/show/" + random.id + "\"\n\n" + random.file_url
          })
        }else{
          e.bot.sendMessage({
            to: e.channelID,
            message: `<@${e.userID}> I am sorry, I can't find anything for you with that tag.`
          })
        }
    });
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
