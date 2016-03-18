var matches = {};


module.exports = {
  dance: {
    lastTime: 0,
    cooldown: 1000,
    description: "dance - what do you think that this command does ? duh",
    category: "personality",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      if(args[0] && args[0].toLowerCase() == "start"){
        if (!uidFromMention.test(args[1])) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> that's not a valid mention!"
          });
          return;
        }
        var mentionedUser = uidFromMention.exec(args[1])[1];
        if (bombs[mentionedUser.toString()]) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> The user mentioned by you is already in a *RPS* minigame, please wait for him to finish."
          })
          return;
        }
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + mentionedUser + ">, " + e.user + " challenged you to a *RPS* game \nTo play the game, please use **" + e.config.general.listenTo + " rps play <rock,paper,scissors>** or you can deny the game, which will instantly forfeit it and mark it as a draw"
        }, function (err, resp) {
          startGame(e, e.userID, mentionedUser, defaultExplodeTime);
        });
      }
    }
  }
}

var initiateBomb = function (e, creator, defuser, time) {
  bombs[defuser.toString()] = {"createdBy": creator, "defused": -1, "correctWire": generatedColor};
  /*setTimeout(function() {
    if(bombs[defuser.toString()] && bombs[defuser.toString()].defused == -1){
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + defuser + "> *The time has run down!*\n**You failed to defuse the bomb and it has exploded.** \n\n[<@" + creator +"> Your friend failed at defusing the bomb. RIP]"
      });
      delete bombs[defuser.toString()];
      return;
    }
  }, time * 1000);*/
}

var getWiner = function(choice1, choice2){
      var result = {
        "rock": {
            "rock": 0, "paper": -1, "scissors": 1
        },
        "paper": {
            "rock": 1, "paper": 0, "scissors": -1
        },
        "scissors": {
            "rock": -2, "paper": 1, "scissors": 0
        }
      }
      return result[choice1.toLowerCase()][choice2.toLowerCase()];
  }


/*"challengedID: "{
  "startedBy": "uid",
  "accepted": -1
  "won": ?
}*/
