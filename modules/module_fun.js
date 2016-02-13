var uidFromMention = /<@([0-9]+)>/;
var CryptoJS = require("crypto-js");

module.exports = {
  size: {
    lastTime: 0,
    cooldown: 500,
    description: "size - returns you uhh size",
    category: "entertainment",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      if (!uidFromMention.test(args[0])) {

        //var rand = randomScalerFloat(tunedRandom(e.userID), 13, 27);
        var rand = size(e.userID);
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> is **" + rand.toPrecision(3) + "** cm, **" + ((rand * 0.03280839895) * 12).toPrecision(3) + "** inches or **" + (rand * 5.3087490157545E+35) + "** Plank lengths"
        });
        return;
      }

      var mentionedUser = uidFromMention.exec(args[0])[1];
      //var rand = randomScalerFloat(tunedRandom(mentionedUser), 13, 27);
      var rand = size(mentionedUser);
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + mentionedUser + "> is **" + rand.toPrecision(3) + "** cm, **" + ((rand * 0.03280839895) * 12).toPrecision(3) + "** inches or **" + (rand * 5.3087490157545E+35) + "** Plank lengths"
      });
    }
  }
}

function seededRandom(seed) {
  var r = seed;
  this.random = function () {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  this.random();
}

function randomScalerFloat(number, low, high) {
  return (number * (high - low) + low);
}

function toFeet(n) {
  var realFeet = ((n * 0.393700) / 12);
  var feet = Math.floor(realFeet);
  var inches = Math.round((realFeet - feet) * 12);
  return feet + " feet " + inches + ' inches';
}

function size(uid) {
    var hash = CryptoJS.MD5(uid).toString();
    var n = (parseInt(hash.substring(5, 9), 16) * 9) % 0xffff;
    var u = n/32768 - 1; // [-1,1]
    if(Math.abs(u) < 0.001) {
        if(u < 0) {
            u = -0.001;
        } else {
            u = 0.001;
        }
    }
    var r = Math.pow(0.5 - Math.cos(Math.PI * u)/2, 1.5) * (u/Math.abs(u)) * Math.exp(u)/Math.E;
    if(r > 1) {
        r = 1;
    }
    var s = Math.abs(15 + r * 10);
    return s;
}
