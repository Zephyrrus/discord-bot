var fs = require('fs');
var http = require('follow-redirects').https;
var request = require('request');

if (GLOBAL.MODE === "production") {
  var auth = require('../configs/auth.json'); // or remove ./ for absolute path ^_^
} else {
  var auth = require('../configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}

var cachedKey = null;

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "searches for tags on deviantart",
      "author": "Zephy",
      "version": "1.0.0",
      "importance": "addon",
      "name": "dA scraper",
      "moduleName": "dA"
    },
    "requiresDB": false,
  },
  category: "anime",
  description: "dA <tags> - Searches for those tags on deviantart",
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
    dAGrab(e, final);
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
  });
}

function getAccessToken(callback) {
  console.log(">>> requested token");
  if (cachedKey != null && cachedKey.expire > ((new Date()).getTime() / 1000)) {
    console.log(">>> Found cached API key for deviantart: " + JSON.stringify(cachedKey));
    return (callback && callback(null, cachedKey))
  }

  var headers = {
      'User-Agent':       'Raylen discord chat client.',
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: 'https://www.deviantart.com/oauth2/token',
      method: 'POST',
      headers: headers,
      qs: {'grant_type': 'client_credentials', 'client_secret': auth.deviantart.client_secret, 'client_id': auth.deviantart.client_id},
      json: true
  }

  request(options, function (err, res, body) {
    if (err) return (callback && callback(err, null));
    console.log(body);
    if (body.access_token != undefined && body.status == "success") {
      cachedKey = { access_token: body.access_token, expire: (((new Date()).getTime() / 1000) + body.expires_in) };
      console.log(">>> returned token " + JSON.stringify(cachedKey, null, '\t'));
      return (callback && callback(null, cachedKey));
    }
  });
}

function dAGrab(e, args) {
  console.log("da called");
  var tags = args.replace(/ +/gi, "+");
  getAccessToken(function (err, res) {
    if (err) return (e.logger.error("[deviantart]_NO_ACCES_TOKEN: " + err));
    var url = "https://www.deviantart.com/api/v1/oauth2/browse/tags?limit=50&tag=" + encodeURIComponent(tags) + "&access_token=" + res.access_token + "&mature_content=" + e.nsfwEnabled
    getJson(url, function (err, res) {
      if (err) return (e.logger.error("[deviantart]_SCRAPE_ERROR: " + err));
        if(res && res.results[0]){
          for(var i = 0; i < res.results.length; i++){
            if(res.results[i].content == undefined) res.results.splice(i,1);
          }
          var random = res.results[randomInt(0, res.results.length)];
          console.log(">>> Choosen random: " + JSON.stringify(random, null, '\t'));
          var str = "Here is a picture of **" + args + "**:\nTitle: **" + (random.title || "N/A") + "**\n";

          e.bot.sendMessage({
            to: e.channelID,
            message: str + "Permalink: \"" + random.url + "\"\n\n" + (random.content.src || "This is a text post ;-;")
          })
        }else{
          e.bot.sendMessage({
            to: e.channelID,
            message: `<@${e.userID}> I am sorry, I can't find anything for you with that tag.`
          })
        }
    });
  });
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}


/* new header:
module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "searches for tags on deviantart",
      "author": "Zephy",
      "version": "1.0.0",
      "importance": "addon",
      "name": "dA scraper",
      "moduleName": "dA"
    },
    "requiresDB": false,
  },
  category: "anime",
  description: "dA <tags> - Searches for those tags on deviantart",
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  init: "add initializer function, this gets the command factory"
}
}

commands: use wind's or
  {name: "parent", function: parentFunction,  childs:[{name:"child1", function: child1Function}, {name: "child2", function: child2Function}]}
  parent name is the activator
  child name is the subcmd, like youtube list, youtube is parent, list is child
*/
