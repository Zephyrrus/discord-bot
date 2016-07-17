var fs = require('fs');
var http = require('follow-redirects').https;
var request = require('request');

module.exports = {
      "MODULE_HEADER":{
        moduleName: "E621 scrapper",
        version: "1.0.3",
        author: "Zephy",
        description: "returns an image of a tags from e621",
      },
      "e621": {
        helpMessage: "Searches for your tags on e621",
        category: "Entertainment",
        params: [
                {
                    id: "character",
                    type: "string",
                    required: true
                }
            ],
        handler: e621Grab,
        cooldown: 5000
      }
}

function getJson(url, callback) {
  var headers = {
      'User-Agent':       'Megu discord chat client.',
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
  args.character += args._str;
  var tags = args.character;
  if(!e.allowNSFW) var tags = tags.replace(/(\+|-)?rating:\w*/gi, '') + " rating:s"
    var url = "https://e621.net/post/index.json?tags=" + encodeURIComponent(tags)
    getJson(url, function (err, res) {
      if (err) return (e.logger.error("[e621]_SCRAPE_ERROR: " + err));
        if(res && res[0]){
          var random = res[randomInt(0, res.length)];
          console.log(">>> Choosen random: " + JSON.stringify(random, null, '\t'));
          var str = "I found a match for the tags **" + args.character + "**:\n";
          e.mention().respond(str + "Permalink: <https://e621.net/post/show/" + random.id + ">\n\n" + random.file_url);
        }else{
          e.mention().respond("I am sorry, I can't find anything for " + args.character);
        }
    });
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}