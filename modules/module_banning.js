var uidFromMention = /<@([0-9]+)>/;
var databaseStructure = [
  { name: "id", type: "autonumber", primaryKey: true },
  { name: "uid", type: "number", required: true },
  { name: "reason", type: "string" },
  { name: "addedDate", type: "datetime", required: true },
  { name: "addedBy", type: "number", required: true }
];
var database = new(require("./database/databaseHandler.js"))('bans', databaseStructure);
//ADD BAN FOR X TIME
var config = require('../configs/config.json');

module.exports = {
  ban: {
    properties: {
      "module": true,
      "info": {
        "description": "used for disable access of specific users to the bot.",
        "author": "Zephy",
        "version": "1.0.0",
        "importance": "core",
        "name": "Ban manager",
        "moduleName": "ban"
      },
      "requiresDB": true,
      databaseStructure: databaseStructure
    },
    category: "management",
    description: ["admin ban <@mention> - bans the mentioned user", "admin unban <mention> - unbans the mentioned user", "admin list - send a private message with every ban"],
    permission: {
      uid: [config.masterID],
      group: ['root', 'moderators'],
      onlyMonitored: true
    },
    action: function (args, e) {
      if (args[0] == "ban") {
        if (!uidFromMention.test(args[1])) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> that's not a valid mention!"
          });
          return;
        }
        var user = uidFromMention.exec(args[1])[1];
        var reason = "";
        if (args.length < 2) reason = "N\\A";
        else
          for (var i = 2; i < args.length; i++) {
            reason += args[i] + ' ';
          }

        if (user == e.config.masterID) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> You cannot ban my master!"
          });
          return;
        }
        database.find([{ "uid": user }], function (err, res) {
          if (err) return (e.printError(e.channelID, err));
          if (res.count > 0) {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  is already banned."
            });
            return;
          } else {
            database.add([{ "uid": user }, { "reason": reason }, { "addedDate": Date() }, { "addedBy": e.userID }], function (err, res) {
              if (err) return (e.printError(e.channelID, err));
              e.bot.sendMessage({
                to: e.channelID,
                message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  has been banned with the reason `" + reason + "`"
              });
            });
          }
        });

      } else if (args[0] == "unban") {
        var user = uidFromMention.exec(args[1])[1];
        database.find([{ "uid": user }], function (err, res) {
          if (err) return (e.printError(e.channelID, err));
          if (res.count < 1) {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  is not banned."
            });
            return;
          } else {
            database.delete([{ "uid": user }], function (err, res) {
              if (err) return (e.printError(e.channelID, err));
              e.bot.sendMessage({
                to: e.channelID,
                message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  removed from the ban list."
              });
            })
          }
        });

      } else if (args[0] == "list") {
        var result = "";
        database.list(function (err, res) {
          if (err) return (e.printError(e.channelID, err));
          for (var i = 0; i < res.count; i++) {
            result += res.result[i]['uid'] + " - " + res.result[i]['reason'] + "\n";
          }
          e.bot.sendMessage({
            to: e.userID,
            message: "<@" + e.userID + "> Here's my ban list: ```\n" + result + "```"
          });
        });
      }
    }
  },
  isBanned: function (uid, callback) {
    database.find([{ "uid": uid }], function (err, res) {
      if (err) return (e.printError(e.channelID, err));
      if (res.count > 0) {
        return (callback && callback(true));
      } else {
        return (callback && callback(false));
      }
    });
  }
}
