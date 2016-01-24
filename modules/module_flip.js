var uidFromMention = /<@([0-9]+)>/;
module.exports = {
  lastTime: 0,
  cooldown: 500,
  description:"flip <value 1|value 2|ect...> - Let the bot choose a random value",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
	var fullArg = "";
	for(i=0;i<args.length;i++){
		fullArg += args[i] + " "
	}
	fullArg = fullArg.substring(0,fullArg.length-1);
	var flip = fullArg.split("|");
	console.log(flip);
	var rand = Math.floor(Math.random()*flip.length);
	console.log(rand);
	e.bot.sendMessage({
		to: e.channelID,
		message: flip[rand]
	});
  }
}
