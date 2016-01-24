module.exports = {
  dance: {
  lastTime: 0,
  cooldown: 5000,
  description: "dance - what do you think that this command does ? duh",
  category: "personality",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e){
    e.bot.sendMessage({
      to: e.channelID,
      message: "(/'-')/\n\u30FD('-'\u30FD)\n(/'-')/\n(/'-')/"
    });
  }
}
};
