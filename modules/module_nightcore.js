var databaseStructure = [
  { name: "id", type: "autonumber", primaryKey: true },
  { name: "youtubeID", type: "string", required: true, unique: true },
  { name: "title", type: "string" },
  { name: "addedDate", type: "datetime", required: true },
  { name: "addedBy", type: "number", required: true },
  { name: "tags", type: "string" }
];
var uidFromMention = /<@([0-9]+)>/;
var youtubeModule = require("./module_youtube.js");
var utils = require("./utils.js");
var database = new(require("./database/databaseHandler.js"))('nightcore', databaseStructure);

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "nightcore dispenser module",
      "author": "Zephy",
      "version": "1.1.0",
      "importance": "addon",
      "name": "Nightcore dispenser",
      "moduleName": "nightcore"
    },
    "requiresDB": true,
    databaseStructure: databaseStructure,
  },
  lastTime: 0,
  cooldown: 0,
  category: "nightcore",
  description: ["nightcore - Dispenses a random nightcore from the database", "nightcore add <youtubeID> - Adds a nightcore to the database", "nightcore list - Lists all nightcores currently added", "nightcore count - Counts all nightcores currently in the database"],
  permission: {
    onlyMonitored: true,
    group: ["dev", "trusted", "root"]
  },
  action: function (args, e) {
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
      var youtubeID = args[1];
      if (regex.test(youtubeID)) {
        database.find([{ "youtubeID": youtubeID.toString() }], function (err, res) {
          if (err) return (e.printError(e.channelID, err));
          if (res.count > 0) {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> I already know this song `" + youtubeID + "`"
            });
            return;
          } else {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> I'm looking up that youtube ID if it's correct, please wait a few seconds!\n" //+ID: `"+youtubeID+"`"
            }, function (error, response) {
              youtubeModule.gettitlefromid(youtubeID, function (resp) {
                if (resp != undefined) {
                  database.add([{ "youtubeID": youtubeID }, { "title": resp.title }, { "addedDate": Date() }, { "addedBy": e.userID }, { "tags": JSON.stringify(resp.tags || ["null"]) }], function (err, res) {
                    if (err) return (e.printError(e.channelID, err));
                    e.bot.editMessage({
                      channel: response.channel_id,
                      messageID: response.id,
                      message: "<@" + e.userID + "> Thanks for teaching me this song.\nTitle: **" + resp.title + "**\n" //+ID: `"+youtubeID+"`"
                    });
                    return;
                  });
                } else {
                  e.bot.sendMessage({
                    channel: response.channel_id,
                    messageID: response.id,
                    message: "<@" + e.userID + "> An error happened while tyring to add `[" + youtubeID + "]`, please try again later. (Undefined response from youtube API)"
                  });
                  return;
                } //end if resp undefined
              });
            });
          } // end database exists counter if
        });
      } else {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Hah nice try, but I am not stupid. \n(Invalid character in your id)"
        });
      }

    } else if (args[0] === "delete") {
      if (args[1] == undefined || args[1].length != 11) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I can't delete this song, it's id seems to be invalid."
        });
        return;
      }
      var youtubeID = args[1];
      database.find([{ "youtubeID": youtubeID }], function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        if (res.count < 1) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I don't know this video."
          });
          return;
        } else {
          database.delete([{ "youtubeID": youtubeID }], function (err, res) {
            if (err) return (e.printError(e.channelID, err));
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> I forgot that video."
            });
          })
        }
      });
      return;

    } else if (args[0] === "count") {
      database.list(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I know **" + res.count + "** nightcores in total"
        });
      });

    } else if (args[0] === "list") {
      var result = [];
      var count = 0;
      database.list(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        count = res.count;
        for (var i = 0; i < res.count; i++) {
          result += res.result[i].youtubeID + " - **" + res.result[i].title + "**\n";
        }
        e.recursiveSplitMessages(e, e.channelID, "<@" + e.userID + "> Listing every nightcore I know: [Count: **" + count + "**]\n\n" + result + "");
      });

    } else if (args[0] === "playlist") {
      var _sendPlaylistDelay = function (e, list, counter) {
          counter = counter || 0;
          var maxValues = 20;
          var delayInSecond = 1;
          var ids = "";
          for (var i = counter; i < maxValues + counter && i < list.length; i++) {
            if ((i + 1 == list.length) || (i + 1 == maxValues + counter)) ids += list[i];
            else ids += list[i] + ",";
          }
          e.bot.sendMessage({
            to: e.userID,
            message: "https://www.youtube.com/watch_videos?video_ids=" + ids
          }, function (err, res) {
            if ((counter + maxValues) < list.length) {
              setTimeout(function () {
                _sendPlaylistDelay(e, list, (counter + maxValues));
              }, delayInSecond * 1000);
            }
          });
        } //_sendPlaylistDelay

      database.list(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        var list = [];
        for (var i = 0; i < res.count; i++) {
          list.push(res.result[i].youtubeID);
        }
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Please wait, I am generating the playlist for you and I will send them as a private messages."
        }, function (err, res) {
          _sendPlaylistDelay(e, list);
        });
      });
    } else {
      database.random(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + ">  I found the perfect song for you in my database \nTitle: **" + res.result[0].title + "**\nLink: https://youtu.be/" + res.result[0].youtubeID
        });
      });
    }
  }
};
