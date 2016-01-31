var uidFromMention = /<@([0-9]+)>/;

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
      "databaseStructure": [
        {name: "id", type: "autonumber", primaryKey: true},
        {name: "uid", type: "number"},
        {name: "reason", type: "string"},
        {name: "addedDate", type: "datetime"},
        {name: "addedBy", type: "number"}
      ]
    },
    category: "management",
    description: ["admin ban <@mention> - bans the mentioned user", "admin unban <mention> - unbans the mentioned user", "admin list - send a private message with every ban"],
    permission: {
      uid: [config.masterID],
      group: ['root', 'moderators'],
      onlyMonitored: true
    },
    action: function(args, e) {
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
        if (e.db.bans[user]) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  is already banned."
          });
          return;
        }

        //e.db.bans.push(uid: {'user': e.user, 'reason': reason || 'N/A'}});
        //e.db.bans[user.toString()] = JSON.parse("{\"user\":\"" + args[1] + "\",\"reason\":\"" + reason + "\"}");
        e.db.bans[user.toString()] = JSON.parse("{\"reason\":\"" + reason + "\"}");
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  has been banned with the reason `" + reason + "`"
        });

        e.db.saveConfig("bans");
      } else if (args[0] == "unban") {
        var user = uidFromMention.exec(args[1])[1];

        if (!e.db.bans[user]) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  is not banned."
          });
          return;
        }

        delete e.db.bans[user];

        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> user " + args[1] + " (" + user + ")  removed from the ban list."
        });

        e.db.saveConfig("bans");
      } else if (args[0] == "debug") {
        console.log(e.db.bans);
      } else if (args[0] == "list") {
        var str = "**Ban list:**\n\n";
        var result = [];
        for (var child in e.db.bans) {
          result += child + " - " + e.db.bans[child].reason + "\n";
        }
        e.bot.sendMessage({
          to: e.userID,
          message: "<@" + e.userID + "> Here's my ban list: ```\n" + result + "```"
        });
      }
    }
  }
}
