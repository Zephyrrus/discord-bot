var uidFromMention = /<@([0-9]+)>/;
module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "random value chooser from a list of values",
      "author": "Zephy & TheEvilSocks",
      "version": "1.1.0",
      "importance": "addon",
      "name": "Flip Module",
      "moduleName": "flip"
    },
    "requiresDB": false
  },
  lastTime: 0,
  cooldown: 500,
  category: "misc",
  description: ["flip <value 1|value 2|ect...> - Let the bot choose a random value", "flip boN <value 1|value 2|etc...> - Does the flip N times and get's shows the value with the highest score"],
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    console.log(args);
    if (args[0].substring(0,2) == "bo") {
      var bestOfs = parseInt(args[0].substring(2));
      if(bestOfs == "NaN") bestOfs = 3;
      if (args.length < 2){
        return;
      }
      args.splice(0,1);

      var fullArg = "";
      for (i = 0; i < args.length; i++) {
        fullArg += args[i] + " "
      }
      fullArg = fullArg.substring(0, fullArg.length - 1);

      var flip = fullArg.split("|");
      var choices = [];
      var maxLength = 0;
      for(var i = 0; i < flip.length; i++){
          choices[i] = {"content": flip[i].trim(), "hits": 0};
          if(choices[i].content.length > maxLength) {
              maxLength = choices[i].content.length;
          }
      }

      var shouldStop;
      var bestOfCounter = 0;
      while(!shouldStop){
        var random = Math.floor(Math.random() * flip.length);
        choices[random].hits++;
        bestOfCounter++;
        if(choices[random].hits ==  bestOfs) shouldStop = true;
        if(bestOfCounter == bestOfs) shouldStop = true;
        //console.log(choices);
      }
      choices.sort(function(a,b) {return (a.hits > b.hits) ? -1 : ((b.hits > a.hits) ? 1 : 0);});

      var result = "<@"+e.userID+"> " + "**Result of the BO" + bestOfs + " flipping:**\n\n```\n";
      for(var i = 0; i < flip.length; i++){
        result += makeSize(choices[i].content, maxLength) + " " + makeProgressBar(choices[i].hits/bestOfs, 30) + " " + choices[i].hits + "\n";
      }
      result += "```";
      e.bot.sendMessage({
        to: e.channelID,
        message: result
      });
    } else {
      var fullArg = "";
      for (i = 0; i < args.length; i++) {
        fullArg += args[i] + " "
      }
      fullArg = fullArg.substring(0, fullArg.length - 1);
      var flip = fullArg.split("|");
      //console.log(flip);
      var rand = Math.floor(Math.random() * flip.length);
      //console.log(rand);
      e.bot.sendMessage({
        to: e.channelID,
        message: flip[rand]
      });
    } // end if/else
  }
}

makeProgressBar = function(num, max) {
    var a = num * max;
    var str = "";
    for(i = 0; i < max; i++) {
        if(i < a) {
            str += "|";
        } else {
            str += "-";
        }
    }

    return str;
}

makeSize = function(str, len) {
  return  str + (new Array(len - str.length + 1)).join(" ");
}
