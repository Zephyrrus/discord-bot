var uidFromMention = /<@([0-9]+)>/;

module.exports = {
  lastTime: 0,
  cooldown: 500,
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    e.bot.deleteMessage({
      channel: e.channelID,
      messageID: e.rawEvent.d.id
    });
    if (args[0].toLowerCase() == "morning") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "Good morning <@" + e.userID + "> \u2764"
      });
    } else if (args[0].toLowerCase() == "hi") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "Hi <@" + e.userID + "> :3. \u2764"
      });
    } else if (args[0].toLowerCase() == "bye") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "Why are you leaving me ? <@" + e.userID + ">. Bye ;-;"
      });
    }
  }
}
