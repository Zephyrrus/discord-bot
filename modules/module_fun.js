var uidFromMention = /<@([0-9]+)>/;

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
        var rand = randomScalerFloat((new seededRandom(e.userID)).random(), 2, 27);
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> is **" + rand.toPrecision(3) + "** cm, **" + ((rand * 0.03280839895) * 12).toPrecision(3) + "** inches or **" + (rand * 5.3087490157545E+35) + "** Plank lengths"
        });
        return;
      }

      var mentionedUser = uidFromMention.exec(args[0])[1];
      var rand = randomScalerFloat((new seededRandom(mentionedUser)).random(), 2, 27);
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
