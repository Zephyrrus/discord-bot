var uidFromMention = /<@([0-9]+)>/;
var fs = require('fs');
var http = require('follow-redirects').https;

if (GLOBAL.MODE === "production") {
  var auth = require('../configs/auth.json');
} else {
  var auth = require('../configs/auth_dev.json');
}
module.exports = {
  lastTime: 0,
  cooldown: 5000,
  category: "osu",
  description: ["osu - Dispenses a random osu! beatmap from the list", "osu add <beatmap_id> - Adds an osu! beatmap to the list", "osu list - Lists all beatmaps currently added", "osu count - Counts all osu! beatmaps currently in the database", "osu random - Gets a random Osu! beatmap from the webpage."],
  permission: {
    onlyMonitored: true,
    group: ["dev", "trusted", "root"]
  },
  action: function(args, e) {
    var osuID = args[1];
    var regex = new RegExp("^[a-zA-Z0-9\-\_]+$");
    console.log(args[0]);
    if (args[0] === "add") {
      var alreadyExists = -1;
      if (args[1] == undefined /*|| args[1].length != 11*/ ) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I can't learn beatmap, it's id seems to be invalid."
        });
        return;
      }
      for (var i = 0; i < e.db.beatmaps['maps'].length; i++) {
        if (e.db.beatmaps['maps'][i].id == osuID) {
          alreadyExists = i;
        }
      }
      if (regex.test(osuID)) {
        if (!(alreadyExists > -1)) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I'm looking up that osu! beatmap ID if it's correct, please wait a few seconds!\n" //+ID: `"+youtubeID+"`"
          }, function(error, response) {
            getBeatmap(osuID, function(resp) {
              if (resp != undefined) {
                e.db.beatmaps['maps'].push({
                  "id": resp.beatmap_id,
                  "artist": resp.artist,
                  "title": resp.title
                });
                e.bot.editMessage({
                  channel: response.channel_id,
                  messageID: response.id,
                  message: "<@" + e.userID + "> Thanks for teaching me this beatmap.\n\nTitle: **" + resp.artist + " - " + resp.title + "**\nLink: https://osu.ppy.sh/s/" + resp.beatmap_id
                });
                e.db.saveConfig("beatmaps");
              } else {
                e.bot.sendMessage({
                  channel: response.channel_id,
                  messageID: response.id,
                  message: "<@" + e.userID + "> This id is invalid or OSU API is not answering my requets `[" + osuID + "]`. :(\n\n"
                });
              }
            });
          });
        } else {
          var osuObject = e.db.beatmaps['maps'][alreadyExists];
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I already know this beatmap. \n\nTitle: **" + osuObject.artist + " - " + osuObject.title + "**\nLink: https://osu.ppy.sh/s/" + osuObject.beatmap_id
          });
        }
      } else {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Hah nice try, but I am not stupid. \n(Invalid character in your id)"
        });
      }

    } else if (args[0] === "delete") {
      for (var i = 0; i < e.db.beatmaps['maps'].length; i++) {
        if (e.db.beatmaps['maps'][i].id == osuID) {
          e.db.beatmaps['maps'].splice(e.db.beatmaps['maps'][i], 1);
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I forgot that beatmap."
          });
          e.db.saveConfig("beatmaps");
          return;
        }
      }

      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I don't know this beatmap."
      });

      return;
    } else if (args[0] === "count") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I know **" + e.db.beatmaps['maps'].length + "** beatmaps in total"
      });

    } else if (args[0] === "list") {
      var result = [];
      for (var i = 0; i < e.db.beatmaps['maps'].length; i++) {
        result += e.db.beatmaps['maps'][i].title + " - " + e.db.beatmaps['maps'][i].id + "\n";
      }
      e.bot.sendMessage({
        to: e.userID,
        message: "<@" + e.userID + "> Listing every Osu! beatmap I know [Count: **" + e.db.beatmaps['maps'].length + "**]```\n" + result + "```"
      });
    } else if (args[0] === "random") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I'm searching for the perfect osu! beatmap for you!\n" //+ID: `"+youtubeID+"`"
      }, function(error, response) {
        getRandomOsu(function(resp) {
          if (resp != undefined) {
            e.bot.editMessage({
              channel: response.channel_id,
              messageID: response.id,
              message: "<@" + e.userID + "> I'm searching for the perfect osu! beatmap for you!\nI found something: \nTitle: **" + resp.artist + " - " + resp.title + "**\nLink: https://osu.ppy.sh/s/" + resp.beatmap_id //+ID: `"+youtubeID+"`"
            });
          }
        });
      });
    } else {
      var osuObject = e.db.beatmaps['maps'][randomInt(0, e.db.beatmaps['maps'].length)];
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I'm searching for the perfect osu! beatmap for you!\nI found something: \nTitle: **" + osuObject.artist + " - " + osuObject.title + "**\nLink: https://osu.ppy.sh/s/" + osuObject.id
      });
    }
  }
};

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function getBeatmap(args, callback) {
  var results = [];
  var url = "https://osu.ppy.sh/api/get_beatmaps?k=" + auth.osu.apikey + "&s=" + args;
  http.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      var response = JSON.parse(body);
      if (response[0]) {
        return callback({
          "beatmap_id": response[0].beatmapset_id,
          "artist": response[0].artist,
          "title": response[0].title
        })
      }
      return callback(undefined);
    });
  }).on('error', function(e) {
    console.log("[Osu! Module] Got an error: ", e);
  });



}

function getRandomOsu(callback) {
  var results = [];
  var url = "https://osu.ppy.sh/api/get_beatmaps?k=" + auth.osu.apikey + "&m=0&since=2016-01-01";
  http.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      var response = JSON.parse(body);
      if (response) {
        for (var beatmaps of response) {
          results.push({
            "beatmap_id": beatmaps.beatmapset_id,
            "artist": beatmaps.artist,
            "title": beatmaps.title
          })
        }
      }
      return callback(results[randomInt(0, results.length)]);
    });
  }).on('error', function(e) {
    console.log("[Osu! Module] Got an error: ", e);
  });


}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
