var uidFromMention = /<@([0-9]+)>/;

module.exports = {
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    var youtubeID = args[1];
    var regex = new RegExp("^[a-zA-Z0-9]+$");
    console.log(args[0]);
    if(args[0] === "add"){
      var alreadyExists = false;
      for(var i = 0; i < e.db.nightcores['id'].length; i++) {
          if(e.db.nightcores['id'][i] == youtubeID) {
              alreadyExists = true;
          }
      }
      if (regex.test(youtubeID)) {
        if(!alreadyExists){
        e.db.nightcores['id'].push(args[1]);
        e.db.saveConfig();
        e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + ">  Thanks for teaching me this song `[" + youtubeID + "]`"
        });
      }else{
        e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + ">  I already know this song `" + youtubeID + "`"
        });
      }
    }else{
      e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Hah nice try, but I am not stupid. \n(Invalid character in your id)"
      });
    }

    }else if(args[0] === "delete"){
      for(var i = 0; i < e.db.nightcores['id'].length; i++) {
          if(e.db.nightcores['id'][i] == youtubeID) {
            console.log(e.db.nightcores['id'][i]);
              e.db.nightcores['id'].splice(e.db.nightcores['id'][i], 1);
              e.bot.sendMessage({
                to: e.channelID,
                message: "<@" + e.userID + "> I forgot that video."
              });
              return;
          }
      }

      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I don't know this video."
      });
      return;
    }
    else{
        var youtubeID = e.db.nightcores['id'][randomInt(0, e.db.nightcores['id'].length)];
        e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + ">  I found the perfect song for you in my database https://youtu.be/" + youtubeID
        });
    }
  }
};

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
