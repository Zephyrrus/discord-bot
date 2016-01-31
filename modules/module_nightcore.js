var uidFromMention = /<@([0-9]+)>/;
var youtubeModule = require("./module_youtube.js");
var utils = require("./utils.js");

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "nightcore dispenser module",
      "author": "Zephy",
      "version": "1.0.0",
      "importance": "addon",
      "name": "Nightcore dispenser",
      "moduleName": "nightcore"
    },
    "requiresDB": true,
    "databaseStructure": {
      "id": "autonumber",
      "youtubeid": "string",
      "title": "string",
      "addedOn": "datetime",
      "addedBy": "number",
      "tags": "string"
    }
  },
  lastTime: 0,
  cooldown: 0,
  category: "nightcore",
  description: ["nightcore - Dispenses a random nightcore from the database", "nightcore add <youtubeID> - Adds a nightcore to the database", "nightcore list - Lists all nightcores currently added", "nightcore count - Counts all nightcores currently in the database"],
  permission: {
    onlyMonitored: true,
    group: ["dev", "trusted", "root"]
  },
  action: function(args, e) {
    var youtubeID = args[1];
    var regex = new RegExp("^[a-zA-Z0-9\-\_]+$");
    //console.log(args[0]);
    if (args[0] === "add") {
      var alreadyExists = false;
      if (args[1] == undefined || args[1].length != 11) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I can't learn this song, it's id seems to be invalid."
        });
        return;
      }

      if (regex.test(youtubeID)) {
        if (!e.db.nightcores[youtubeID.toString()]) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I'm looking up that youtube ID if it's correct, please wait a few seconds!\n" //+ID: `"+youtubeID+"`"
          }, function(error, response) {
            youtubeModule.gettitlefromid(youtubeID, function(resp) {
              if (resp != undefined) {
                //e.db.nightcores['id'].push(args[1]);
                e.db.nightcores[youtubeID.toString()] = JSON.parse("{\"title\":\"" + resp.title + "\",\"addedBy\":\"" + e.userID + "\",\"addedOn\":\"" + Date() + "\",\"tags\":" + JSON.stringify(resp.tags || ["null"]) + "}");
                e.bot.editMessage({
                  channel: response.channel_id,
                  messageID: response.id,
                  message: "<@" + e.userID + "> Thanks for teaching me this song.\nTitle: **" + resp.title + "**\n" //+ID: `"+youtubeID+"`"
                });
                e.db.saveConfig("nightcores");
              } else {
                e.bot.sendMessage({
                  channel: response.channel_id,
                  messageID: response.id,
                  message: "<@" + e.userID + "> An error happened while tyring to add `[" + youtubeID + "]`, please try again later. (Undefined response from youtube API)"
                });
              }
            });
          });
        } else {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I already know this song `" + youtubeID + "`"
          });
        }
      } else {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Hah nice try, but I am not stupid. \n(Invalid character in your id)"
        });
      }

    } else if (args[0] === "delete") {
      if (e.db.nightcores[youtubeID]) {
        delete e.db.nightcores[youtubeID];
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I forgot that video."
        });
        e.db.saveConfig("nightcores");
        return;
      }

      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I don't know this video."
      });

      return;
    } else if (args[0] === "count") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I know **" + e.db.nightcores.length + "** nightcores in total"
      });

    } else if (args[0] === "list") {
      var result = [];
      var count = 0;
      for (var child in e.db.nightcores) {
        result += child + " - **" + e.db.nightcores[child].title + "**\n";
        count++;
      }
      recursiveSplitMessages(e, "<@" + e.userID + "> Listing every nightcore I know: [Count: **" + count + "**]\n\n" + result + "");
    } else {
      var youtubeID = pickRandomProperty(e.db.nightcores);
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + ">  I found the perfect song for you in my database \nTitle: **" + e.db.nightcores[youtubeID].title + "**\nLink: https://youtu.be/" + youtubeID
      });
    }
  }
};

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function pickRandomProperty(obj) {
  var result;
  var count = 0;
  for (var prop in obj)
    if (Math.random() < 1 / ++count)
      result = prop;
  return result;
}


function recursiveSplitMessages(e, msg, counter, lastLength) {
  counter = counter || 1;
  var maxUncalculatedLength = 1900;
  var total = Math.ceil(msg.length / maxUncalculatedLength);
  var aditionalLenght = 0;
  while (msg[((lastLength || 0) + maxUncalculatedLength) + aditionalLenght] != "\n" && (maxUncalculatedLength + aditionalLenght) < 1990) {
    aditionalLenght++;
  }
  var currentSplice = msg.substring((lastLength || 0), parseInt((lastLength || 0) + (maxUncalculatedLength + aditionalLenght)));

  //console.log(counter);
  e.bot.sendMessage({
    to: e.userID,
    message: currentSplice
  }, function(resp) {
    if (counter < total) {
      recursiveSplitMessages(e, msg, counter + 1, parseInt((maxUncalculatedLength + aditionalLenght)) + parseInt((lastLength || 0)));
    }
  });
}
