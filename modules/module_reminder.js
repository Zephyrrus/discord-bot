var uidFromMention = /<@([0-9]+)>/;
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
  description: "remind <seconds> <data> - Will remind you in <seconds> about <data>",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    if (args.length >= 2) {
      /*if(hmsToSecondsOnly(parseInt(args[0])) instanceof Array int){
      	e.bot.sendMessage({
      		to: e.channelID,
      		message: "Usage: \nremind <seconds> <data> - Will remind you in <seconds> about <data>"
      	});
      	return;
      }*/
      var timeout = hmsArgumentParser(args[0]);

      var reminder = "";
      for (i = 1; i < args.length; i++)
        reminder += args[i] + " ";
      reminder = reminder.substring(0, reminder.length - 1);

      setTimeout(function() {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> **Reminder**\n```" + reminder + "```"
        });
      }, timeout * 1000);
    }
  }
}

function hmsArgumentParser(str) {
  var p = str.split(':'),
    s = 0,
    m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }

  return s;
}
