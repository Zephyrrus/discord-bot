var uidFromMention = /<@([0-9]+)>/;
var slaps = ["a large trout","a large pig","a large horse", "a large cat", "a Big Mac", "a large dog", "a computer", "a stolen car"]
var answersArr = [
  [
    'Maybe.', 'Certainly not.', 'I hope so.', 'Not in your wildest dreams.',
    'There is a good chance.', 'Quite likely.', 'I think so.', 'I hope not.',
    'I would say so.', 'Never!', 'Fuhgeddaboudit.', 'Ahaha! Really?!?', 'Pfft.',
    'Sorry, bucko.', 'Hell, yes.', 'Hell to the no.', 'The future is bleak.',
    'The future is uncertain.', 'I would rather not say.', 'Who cares?',
    'Possibly.', 'Never, ever, ever.', 'There is a small chance.', 'Yes!'
  ],
  [
    'As I see it, yes.', 'Better not tell you now.', 'Cannot predict now.',
	  'Don\'t count on it.', 'In your dreams.', 'It is certain.', 'Most likely.',
    'My CPU is saying no.', 'My CPU is saying yes.', 'My CPU is saying there is a very slim chance.',
    'Out of psychic coverage range.', 'Signs point to yes.', 'Sure, sure.', 'Very doubtful.',
	  'Without a doubt.', 'Yes, definitely.', 'You are doomed.', 'You can\'t handle the truth.','No, never.',
	  'Impossible.','As I see it, no.','Definitely no.','Definitely yes.','Only in your wildest dreams.','Not really.',
	  'Of course.'
	]
];

var slapExceptions = [''];
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
      e.bot.sendMessage({
        to: e.channelID,
        message: "(/'-')/\n\u30FD('-'\u30FD)\n(/'-')/\n(/'-')/"
      });
    }
  },

  slap: {
    lastTime: 0,
    cooldown: 1000,
    description: "slap <@mention> - slaps the mentioned person",
    category: "entertainment",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      var ouch = ["Ouch!","That hurt!","Oww!","Will you stop that!",">_>"]
      if (!uidFromMention.test(args[0])) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "*slaps <@" + e.userID + "> around a bit with a large cat for not mentioning who to slap.*"
        });
        return;
      }
      var mention = uidFromMention.exec(args[0])[1];
      //add an exception list
      if(mention == e.bot.id){
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> *" + ouch[randomInt(0, ouch.length)] + "*"
        });
        return;
      }

      if(args[1] == undefined){
        e.bot.sendMessage({
          to: e.channelID,
          message: "*slaps <@" + mention+ "> around a bit with " + slaps[randomInt(0, slaps.length)] + ".*"
        });
      }else{
        args.splice(0, 1);
        e.bot.sendMessage({
          to: e.channelID,
          message: "*slaps <@" + mention+ "> around a bit " + args.join(" ") + ".*"
        });
      }
    }
  },

  ball:{
    lastTime: 0,
    cooldown: 1000,
    description: "8ball - gives a very accurate, very inaccurate, or otherwise statistically improbable answers",
    category: "entertainment",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      var rand = (new seededRandom(sumASCII(args.join(" ") + " "))).random();
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> :crystal_ball: *" + answersArr[0][randomScaler(rand, 0, answersArr[0].length)] + "* :crystal_ball:"
      });
    }
  }
};


function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function randomScaler(number, low, high) {
  return Math.floor(number * (high - low) + low);
}

function sumASCII(string){
  return string.toLowerCase().split('').map(function (char) {
      return char.charCodeAt(0);
    }).reduce(function (current, previous) {
      return previous + current;
    });
}

function seededRandom(seed) {
  var r = seed;
  this.random = function () {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  this.random();
}
