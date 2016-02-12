var uidFromMention = /<@([0-9]+)>/;
var parser = require("./reminderParser.js");
var reminderFromString = /[^;%$\|]*/

module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "reminds you about something in xhxmxs",
      "author": "Zephy",
      "version": "1.0.0",
      "importance": "addon",
      "name": "Reminder module",
      "moduleName": "reminder"
    },
    "requiresDB": false
  },
  lastTime: 0,
  cooldown: 500,
  category: "misc",
  description: "remind <time> <data> - Will remind you in <time> about <data>",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
      var joinedArguments = args.join(" ");
      var reminder = reminderFromString.exec(joinedArguments)[0];
      var split = [reminder, joinedArguments.substring(reminder.length+1)];
      console.log(split);
      if(split[0] == "" || split[1] == ""){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Missing time variable or message to remind you about\n**Usage**: \nremind <time> [separator] <message> - Will remind you in x about <message>\nAny of the following characters can be used as a separator: **;%$|**"
        });
        return;
      }
      //userToRemind, addedTume, expireTime, reminded
      //if relative < 30.000 push to a local stack, otherwise push into the database
      //console.log(parsedTimeTemp.absolute);

      var parsedTimeTemp = parser(split[0]);
      if(parsedTimeTemp.mode != 'error'){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I will remind you about `" + split[1] + "` in **" + split[0] + "**"
        });
        setTimeout(function() {
          e.bot.sendMessage({
            to: e.channelID,
            message: "Hey <@" + e.userID + ">!\nYou told me to remind you about `" + split[1] + "` " + split[0] + " ago"
          });
        }, parsedTimeTemp.relative);
      }
  }
}
