var uidFromMention = /<@([0-9]+)>/;

module.exports = {
  lastTime: 0,
  cooldown: 5000,
  description: ["message add <message> - Adds a custom message to the database", "message remove <message> - Removes the message from the database", "message list - Lists every message from the database"],
  category: "personality",
  permission: {
    group: ["dev", "moderators"],
    onlyMonitored: true
  },
  action: function(args, e) {
    if (args[0] == "add") {
      var msg = args.slice(2).join(" ");
      e.db.messages[args[1]] = msg;
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> added `" + args[1] + "`: " + msg
      });
      e.db.saveConfig("messages");
    } else if (args[0] == "remove") {
      if (!e.db.messages[args[1]]) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> `" + args[1] + "` doesn't exist"
        });
        return;
      }
      delete e.db.messages[args[1]];
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> removed `" + args[1] + "`"
      });
      e.db.saveConfig("messages");
    } else if (args[0] == "list") {
      var result = "";
      for (var child in e.db.messages) {result += child + " - " + e.db.messages[child] + "\n"};
      e.bot.sendMessage({
        to: e.userID,
        message: "<@" + e.userID + "> Listing every message I know [Count: **" + Object.keys(e.db.messages).length + "**]```\n" + result + "```"
      });
    }
  }
}
