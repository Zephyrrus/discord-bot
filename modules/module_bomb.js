var uidFromMention = /<@([0-9]+)>/;

var bombs = {};
var colors = ["red", "green", "blue"]

//"defuserID": {"createdBy": e.userID, "defused": false, "correctWire": }
module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "bomb",
      "author": "Zephy",
      "version": "1.0.1",
      "importance": "addon",
      "name": "Bomb minigame",
      "moduleName": "bomb"
    },
    "requiresDB": false
  },
  lastTime: 0,
  cooldown: 500,
  category: "minigames",
  description: ["bomb start <@mention> - starts a defuse the bomb minigame (45 second bomb timer)", "bomb wire <red/green/blue> - defuses a bomb"],
  permission: {
    onlyMonitored: true
  },
  action: function (args, e) {
    var defaultExplodeTime = 45;
    if (args[0] && args[0].toLowerCase() == "start") {

      if (!uidFromMention.test(args[1])) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> that's not a valid mention!"
        });
        return;
      }
      var mentionedUser = uidFromMention.exec(args[1])[1];
      if(mentionedUser == e.userID){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> uwotm8."
        })
        return;
      }
      if(mentionedUser == e.bot.id){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> uwotm8."
        })
        return;
      }
      if (bombs[mentionedUser.toString()]) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> The user mentioned by you is already in a *Defuse the bomb* minigame, please wait for him to finish."
        })
        return;
      }
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + mentionedUser + ">, " + e.user + " challenged you to a *Defuse the bomb* game, you have **" + defaultExplodeTime + " seconds to defuse it**. \nTo defuse the bomb you must cut a wire. To cut a wire, use the following command: **" + e.config.general.listenTo + " bomb wire <red,green,blue>** or you can use bomb run away, which will instantly forfeit the game."
      }, function (err, resp) {
        initiateBomb(e, e.userID, mentionedUser, defaultExplodeTime);
      });

    } else if (args[0] && args[0].toLowerCase() == "wire") {
      if (!bombs[e.userID.toString()]) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> No games in progress for you right now. Maybe find some friends who will challenge you to a game ? :D"
        });
        return;
      }
      var color = (args[1] && args[1].toLowerCase()) || undefined;
      if (!color || (color != "red" && color != "green" && color != "blue")) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> Invalid wire color."
        });
        return;
      }
      // do we even need this if the bomb explodes instantly ?
      if(bombs[e.userID.toString()].defused != -1){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> You can't cut more than a single wire."
        });
        return;
      }
      if(bombs[e.userID.toString()].correctWire === color){
        bombs[e.userID.toString()].defused = 1;
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> *You sucessfully defused the evil bomb*. \n\n[<@" + bombs[e.userID.toString()].createdBy +"> The bomb was successfully defused]"
        });
        delete bombs[e.userID.toString()];
        return;
      }else{
        bombs[e.userID.toString()].defused = 0;
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> *You cut the wrong wire and the bomb explodes.* \n\n[<@" + bombs[e.userID.toString()].createdBy +"> Your friend failed at defusing the bomb. RIP]"
        });
        delete bombs[e.userID.toString()];
      }
    } else {

    }
  }
}

var initiateBomb = function (e, creator, defuser, time) {
  var generatedColor = getColor();
  bombs[defuser.toString()] = {"createdBy": creator, "defused": -1, "correctWire": generatedColor};
  setTimeout(function() {
    if(bombs[defuser.toString()] && bombs[defuser.toString()].defused == -1){
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + defuser + "> *The time has run down!*\n**You failed to defuse the bomb and it has exploded.** \n\n[<@" + creator +"> Your friend failed at defusing the bomb. RIP]"
      });
      delete bombs[defuser.toString()];
      return;
    }
  }, time * 1000);
}

var getColor = function(){
  var colors = ["red", "green", "blue"];
  function _randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
  }
  return (colors[0, _randomInt(0, colors.length)]);
}
