var Snoocore = require('snoocore');

if (GLOBAL.MODE === "production") {
  var auth = require('../configs/auth.json');
}
else {
  var auth = require('../configs/auth_dev.json');
}
var fs = require('fs');
var http = require('follow-redirects').http;
var reddit = new Snoocore({
  userAgent: 'DiscordBot - Rin - Version 1.2.11', // unique string identifying the app
  throttle: 300,
  oauth: {
    type: 'script',
    key: auth.reddit.apikey, // OAuth client key (provided at reddit app)
    secret: auth.reddit.appsecret, // OAuth secret (provided at reddit app)
    username: auth.reddit.username, // Reddit username used to make the reddit app
    password: auth.reddit.password, // Reddit password for the username
    // The OAuth scopes that we need to make the calls that we
    // want. The reddit documentation will specify which scope
    // is needed for evey call
    scope: ['identity', 'read', 'vote']
  }
});

function getSubreddit(subreddit, NSFWFlag, callback) {
  var ret;
  var links = [];

  function _populateList(result) {
    for (var child of result.get.data.children) {
      child.data.url = child.data.url.replace(/\?.*$/i, '');
      var r = new RegExp("(\.png|\.jpg|\.png,\.jpg)");
      if (r.test(child.data.url)) links.push({
        "title": child.data.title,
        "link": child.data.url,
        "NSFW": child.data.over_18 || false
      });
    }
  }
  reddit('/r/' + subreddit + '/hot').listing({
    limit: 100
  }).then(
    function(result) {
      _populateList(result);
      if (result.get.after == null && links.length === 0) return undefined; // invalid subreddit, return without getting the next slice
      return result.next(); // send the paging to the next then for getting the next slice
    }).then(function(result) {
    if (result == undefined) return callback(undefined);
    _populateList(result);
    for (var i = links.length - 1; i >= 0; i--) {
      if (links[i].NSFW === true && !NSFWFlag) {
        links.splice(i, 1);
      }
    }
    return callback(links[randomInt(0, links.length)]);
  });
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function doReddit(args, e) {
  var arguments = args;
  getSubreddit(arguments, e.config.allowNSFW, function(response) {
    e.bot.deleteMessage({
      channel: e.channelID,
      messageID: e.rawEvent.d.id
    });

    if (response != undefined) {
      var responseReddit = response;
      var link = response.link.toString();
      link = link.replace(/^https:\/\//i, 'http://');
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
              message: "<@" + e.userID + ">: **I am grabbing a random image from /r/" + args + " for you** \u2764",
              //typing: true
            }, function(response) { //CB Optional
              e.bot.uploadFile({
                to: e.channelID,
                file: fs.createReadStream(filename)
              }, function(response) { //CB Optional
                e.bot.sendMessage({
                  to: e.channelID,
                  message: "Title: **" + responseReddit.title + "**",
                  //typing: true
                });
                if (e.config.deletereddit) fs.unlink(filename);
              });
            });
          }
        });
      });
    } else {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + ">: **I am sorry, I can't find any image for you on /r/" + args + " ;-;**",
      });
    }
  });
}

module.exports = {
  lastTime: 0,
  cooldown: 5000,
  category: "entertainment",
  description: "reddit <subreddit> - posts a random image from that subreddit",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    doReddit(args, e);
  }
};
/*
module.exports = {
    name: "Reddit module for bot",
    description: "Gets an image from reddit and posts it to the chat.",
    author: "Zephy",
    version: "1.0.0",
    parentcommand: "reddit",
    init: function(commandRegister) {
        commandRegister.add("get", "get <subreddit> - Posts an image from the specified subreddit", ["reddit.subreddit"], doReddit); // alias, description, permission name, function
        commandRegister.add("kemo", "kemo - Posts an image from the kemonomimi subreddit", ["reddit.kemonomimi"], doKemo);
        commandRegister.add("nsfw", "toggles the NSFW filter on/off for that channel",["reddit.nsfwfilter"], nsfwToggle);
    }
}*/
