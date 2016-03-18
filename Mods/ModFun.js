var request = require("request");
var cheerio = require("cheerio");
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

var quotes = [
  'Born too late to explore the earth\nBorn too soon to explore the galaxy\nBorn just in time to **browse dank memes**',
  'Don\'t let your dreams be memes. - *Shia LaBeouf*',
  'Feels good man. - *Pepe*',
  'Going to church doesn’t make you a Christian any more than standing in a garage makes you a car. - *Billy Sunday*',
  'How is it one careless match can start a forest fire, but it takes a whole box to start a campfire?',
  'I always arrive late at the office, but I make up for it by leaving early. - *Charles Lamb*',
  'I asked God for a bike, but I know God doesn’t work that way. So I stole a bike and asked for forgiveness. - *Emo Philips*',
  'I couldn’t repair your brakes, so I made your horn louder. - *Steven Wright*',
  'I dream of a better tomorrow, where chickens can cross the road and not be questioned about their motives.',
  'I dream of a better tomorrow, where chickens can cross the road and not be questioned about their motives.',
  'I hate when old people poke you at a wedding and say you\'re next. So when I was at a funeral I poked them and said you\'re next.',
  'I intend to live forever. So far, so good. - *Steven Wright*',
  'I like to beat the brush. - *Bob Ross*',
  'I think the worst time to have a heart attack is during a game of charades. - *Demetri Martin*',
  'Jet fuel can\'t melt steel beams. - *Barack Obama*',
  'Jet fuel can\'t melt steel memes. - *Barack Obama*',
  'Just do it. - *Shia Labeouf*',
  'Just tap it. - *Bob Ross*',
  'My favorite machine at the gym is the vending machine.',
  'Press F to pay respects.',
  'Shwooop. Hehe. You have to make those little noises, or it just doesn\'t work. - *Bob Ross*',
  'That\'ll be our little secret. - *Bob Ross*',
  'The only mystery in life is why the kamikaze pilots wore helmets. - *Al McGuire*',
  'The only thing worse than yellow snow is green snow. - *Bob Ross*',
  'There\'s nothing wrong with having a tree as a friend. - *Bob Ross*',
  'We don\'t make mistakes, just happy little accidents. - *Bob Ross*',
  'When tempted to fight fire with fire, remember that the Fire Department usually uses water.'
];

module.exports = {
  "MODULE_HEADER":{
    moduleName: "Fun commands",
    version: "1.2.0",
    author: "Zephy",
    description: "random commands.",
  },
  "dance": {
    helpMessage: "dance :D",
    category: "Entertainment",
    handler: doDance,
  },
  "slap": {
    helpMessage: "slaps the mentioned user",
    category: "Entertainment",
    handler: doSlap,
    params: [{
        id: "user",
        type: "mention",
        required: false
    },
    {
        id: "slapobject",
        type: "string",
        required: false
    }]
  },
  "8ball": {
    helpMessage: "gives a very accurate, very inaccurate, or otherwise statistically improbable answers",
    category: "Entertainment",
    handler: doBall
  },
  "shitquote":{
    helpMessage: "5/7 quotes repository",
    category: "Entertainment",
    handler: doQuote
  },
  "gangsta":{
    helpMessage: "Tranzizzle Dis Shiznit",
    category: "Entertainment",
    handler: doGangsta
  },
  "love":{
    helpMessage: "What is love?",
    category: "Weeb",
    handler: babyDontHurtMe
  },
  "fancy":{
    helpMessage: "Why is this even a command ?",
    category: "Random",
    handler: fancy,
    params: [{
        id: "text",
        type: "string",
        required: true
    }]
  }
}






function doDance(e, args){
  e.respond("(/'-')/", function(err, response){
    if(err) return;
    e.editMessage(response.id, e.channelID, "\u30FD('-'\u30FD)", function(err, response){
      if(err) return;
      e.editMessage(response.id, e.channelID, "(/'-')/", function(err, response){
        if(err) return;
        e.editMessage(response.id, e.channelID, "\u30FD('-'\u30FD)", function(err, response){
          if(err) return;
        });
      });
    });
  })
}

function doSlap(e, args){
  var ouch = ["Ouch!","That hurt!","Oww!","Will you stop that!",">_>", "Stop... **Stop it!**"];
  if (!args.user) {
    e.respond("*slaps <@" + e.userID + "> around a bit with a large cat for not mentioning who to slap.*");
    return;
  }

  if(args.user == e._disco.bot.id){
    e.mention().respond("*" + ouch[randomInt(0, ouch.length)] + "*");
    return;
  }

  if(args.slapobject == undefined){
    e.respond("*slaps <@" + args.user + "> around a bit with " + slaps[randomInt(0, slaps.length)] + ".*");
  }else{
    e.respond("*slaps <@" + args.user + "> around a bit " + args.slapobject + args._str + ".*");
  }
}

function doBall(e, args){
  var rand = (new seededRandom(sumASCII(args._str + " "))).random();
  e.mention().respond(":crystal_ball: *" + answersArr[0][randomScaler(rand, 0, answersArr[0].length)] + "* :crystal_ball:")
}

function doQuote(e,args){
  e.respond(quotes[randomInt(0, quotes.length)]);
}


function doGangsta(e, args){
  e.deleteMessage();
request.post("http://www.gizoogle.net/textilizer.php", {
    form: {
        translatetext: args._str
    }
}, function(err, response, body) {
    var $ = cheerio.load(body);
    e.mention().respond($("textarea").val() + " - *" + e.user + "*")
})
}

function babyDontHurtMe(e, args){
  e.mention().respond("I only love my **EXPLOSION** spell. (and maybe you a bit \u2764)");
}

function fancy(e, args){
  str = "";
  args.text += args._str;
  if(args.text.length > 20) {
    e.mention().respond("I don't fancy that.")
    return;
  }
  var split = args.text.split("");
  for(var i = 0; i < args.text.length; i++){
    split.push(split.shift());
    str += split.join("") + "\n";
  }
  e.code(str).respond();
}













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
