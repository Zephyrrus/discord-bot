module.exports = {
  decode: {
    lastTime: 0,
    cooldown: 500,
    category: "misc",
    description: "decode <base64> <text> -  Decode from something to normal text",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
      if (args[0].toLowerCase() == "base64") {
        var toDecode = "";
        for (i = 1; i < args.length; i++) {
          toDecode += args[i] + " ";
        }
        toDecode = toDecode.substring(0, toDecode.length - 1);
        var encoded = new Buffer(toDecode, 'base64').toString('utf8');
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + ">\n```" + encoded + "```"
        });
      }
    }
  },
  encode: {
    lastTime: 0,
    cooldown: 500,
    category: "misc",
    description: "encode <base64> <text> - Encode some text",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
      if (args[0].toLowerCase() == "base64") {
        var toEncode = "";
        for (i = 1; i < args.length; i++) {
          toEncode += args[i] + " ";
        }
        toEncode = toEncode.substring(0, toEncode.length - 1);
        var encoded = new Buffer(toEncode).toString('base64');
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + ">\n```" + encoded + "```"
        });
      }
    }
  }
}
