var uidFromMention = /<@([0-9]+)>/;
module.exports = {
  lastTime: 0,
  cooldown: 500,
  category: "misc",
  description: "remind <seconds> <data> - Will remind you in <seconds> about <data>",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
	if(args.length >= 2){
		if(parseInt(args[0]) != args[0]){
			e.bot.sendMessage({
				to: e.channelID,
				message: "Usage: \nremind <seconds> <data> - Will remind you in <seconds> about <data>"
			});
			return;
		}
		var timeout = parseInt(args[0]);
		var reminder = "";
		for(i=1;i<args.length;i++)
			reminder+=args[i] + " ";
		reminder = reminder.substring(0,reminder.length-1);

		setTimeout(function(){
			e.bot.sendMessage({
				to: e.channelID,
				message: "<@" + e.userID + "> **Reminder**\n```" + reminder + "```"
			 });
		},timeout*1000);
	}
  }
}
