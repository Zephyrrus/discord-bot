var databaseStructure = [
  { name: "id", type: "autonumber", primaryKey: true },
  { name: "youtubeID", type: "string", required: true, unique: true },
  { name: "title", type: "string" },
  { name: "addedDate", type: "datetime", required: true },
  { name: "addedBy", type: "number", required: true },
  { name: "tags", type: "string" }
];
var uidFromMention = /<@([0-9]+)>/;
var parser = require('moment-parser');
var reminderFromString = /[^;%$\|]*/

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "reminds you about something in xhxmxs",
      "author": "Zephy",
      "version": "1.2.1",
      "importance": "addon",
      "name": "Reminder module",
      "moduleName": "reminder"
    },
    "requiresDB": true,
    databaseStructure: databaseStructure
  },
  lastTime: 0,
  cooldown: 500,
  category: "misc",
  description: "remind <time> <data> - Will remind you in <time> about <data>",
  permission: {
    onlyMonitored: true
  },
  action: function (args, e) {
    var joinedArguments = args.join(" ");
    var reminder = reminderFromString.exec(joinedArguments)[0];
    var split = [reminder, joinedArguments.substring(reminder.length + 1)];
    console.log(split);
    if (split[0] == "" || split[1] == "") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Missing time variable or message to remind you about\n**Usage**: \nremind <time> [separator] <message> - Will remind you in x about <message>\nAny of the following characters can be used as a separator: **;%$|**"
      });
      return;
    }
    //userToRemind, addedTume, expireTime, reminded
    //if relative < 30.000 push to a local stack, otherwise push into the database
    //console.log(parsedTimeTemp.absolute);

    try {
      var parsedTimeTemp = parser.parseDuration(split[0]);
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I will remind you about `" + split[1] + "` in **" + split[0] + "**" + "\nDBG```javascript\n" + JSON.stringify(parsedTimeTemp) + "```"
      });
      setTimeout(function () {
        e.bot.sendMessage({
          to: e.channelID,
          message: "Hey <@" + e.userID + ">!\n**You told me to remind you about** ```" + split[1] + "```" + split[0] + " ago"
        });
      }, parsedTimeTemp._milliseconds);
    } catch (error) {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Can't parse your time input"
      });
    }
  }
}

var parseUgly = function (timeout) {
  var hours = 0;
  var minutes = 0;
  var seconds = 0;
  if (timeout.toLowerCase().split("h").length >= 2) {
    hours = parseInt(timeout.toLowerCase().split("h")[0]);
    timeout = timeout.toLowerCase().split("h")[1];
  }
  if (timeout.toLowerCase().split("m").length >= 2) {
    minutes = parseInt(timeout.toLowerCase().split("m")[0]);
    timeout = timeout.toLowerCase().split("m")[1];
  }
  if (timeout.toLowerCase().split("s").length >= 2) {
    seconds = parseInt(timeout.toLowerCase().split("s")[0]);
  }
  return (hours * 60 * 60) + (minutes * 60) + seconds
}
