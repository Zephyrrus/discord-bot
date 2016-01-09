/*Variable area*/
var VERSION = "1.1.4";
var MODE = "production";
var auth = require('./auth.json');
var Discordbot = require('discord.io');
var fs = require('fs');
var http = require('http');

var bot = new Discordbot({
  email: auth.email,
  password: auth.password,
  autorun: true
});

var startTime = Math.round(new Date() / 1000);;
var personalRoom = 133337987520921600;
var reddit = require('./reddit');
process.argv.forEach(function(val, index, array) {
  //console.log(index + ': ' + val);
  if (val === "development") MODE = "development";
});
if (MODE === "production") var config = require('./config.json');
else var config = require('./config_dev.json');
var database = new(require("./database.js"))();
var away = [];
config.deletereddit = config.deletereddit || false;
/*----------------------------------------------*/
/*Event area*/
bot.on("err", function(error) {
  console.log(error)
});

bot.on("ready", function(rawEvent) {
  bot.editUserInfo({
    password: auth.password, //Required
    username: config.username //Optional
  })
  console.log("Connected!");
  console.log("Logged in as: ");
  console.log(bot.username + " - (" + bot.id + ")");
  bot.setPresence({
    idle_since: null,
    game: config.defaultStatus
  });
  console.log("Version: " + VERSION);
  console.log("Set status!");
});

/*----------------------------------------------*/

var commands = {
  ping: {
    permission: {
      uid: [config.masterID],
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      sendMessages(e, ["<@" + e.userID + "> Pong"]);
      console.log("Ponged <@" + e.userID + ">");
    }
  },
  id: {
    permission: {
      uid: [config.masterID],
      group: ["dev"],
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      sendMessages(e, ["The ID of this channel is `" + e.channelID + "`"]);
    }
  },
  reddit: {
    permission: {
      onlyMonitored: true
    },
    cooldown: 10000,
    lastTime: 0,
    action: function(args, e) {
      doReddit(args, e);
    }
  },
  kemo: {
    permission: {
      onlyMonitored: true
    },
    cooldown: 10000,
    lastTime: 0,
    action: function(args, e) {
      doReddit("kemonomimi", e);
    }
  },
  setstatus: {
    permission: {
      uid: [config.masterID],
      onlyMonitored: true
    },
    action: function(args, e) {
      e.bot.setPresence({
        idle_since: null,
        game: args.join(" ")
      });
    }
  },
  myid: {
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
      sendMessages(e, ["<@" + e.userID + ">: **Your ID**: `@" + e.userID + "`"]);
    }
  },
  echo: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      //ADD CHECK FOR -H ARGS WHICH REMOVES THE FROM THINGIE
      sendMessages(e, [args.join(" ") + " [<@" + e.userID + ">]"]);
      e.bot.deleteMessage({
        channel: e.channelID,
        messageID: e.rawEvent.d.id
      });
    }
  },
  bat: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      sendMessages(e, ["**Guide from** <@132130219631837184> **to run a bat.**"]);
      bot.uploadFile({
        to: e.channelID,
        file: fs.createReadStream("images/giphy.gif")
      }, function(response) { //CB Optional

      });
    }
  },
  emote: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      if (e.db.images[args[0].toLowerCase()]) {
        bot.uploadFile({
          to: e.channelID,
          file: fs.createReadStream(database.images[args[0].toLowerCase()])
        })
      } else {
        sendMessages(e, ["<@" + e.userID + ">: **Sorry I don't know that twitch emote right now ;_;**\nMessage Zephy and let him know that you want it added."]);
      }
    }
  },
  hs: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      var path = "images/hs/" + args.join(" ") + ".png";
      console.log(path);
      if (args != null) {
        fs.exists(path, function(exists) {
          if (exists) {
            e.bot.uploadFile({
              to: e.channelID,
              file: fs.createReadStream(path)
            }, function(response) { //CB Optional
              //	console.log(response);
            });
            e.bot.deleteMessage({
              channel: e.channelID,
              messageID: e.rawEvent.d.id
            });
          } else {
            sendMessages(e, ["<@" + e.userID + ">: **Sorry I don't know that HS emote right now ;_;**"]);
          }
        });
      }
    }
  },
  list: {
    permission: {
      onlyMonitored: true,
      group: ["dev"],
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      /*sendMessages(e, ["**Listing all emotes what I know: **",
        "```4Head ANELE ArsonNoSexy AsianGlow AtGL AthenaPMS AtIvy AtWW azaConrad azaDRAIN azaERASED azaFox azaHAPPY azaHHH azaMAD azaRAT BabyRage BatChest BCWarrior BibleThump BigBrother BionicBunion BlargNaut BloodTrail boomerBoomerMosta boomerBoomerStapler  boomerDrink boomerGlantz boomerInc boomerKappe boomerKrone boomerMinus boomerPizza boomerSabotage BORT BrainSlug BrokeBack BuddhaBar chingAus chingBday chingBig chingBinbash chingBomb chingEdge chingFace chingHype chingJail chingMaiku chingMod chingMoney chingPanda chingPotato chingS chingSense chingSub chingTgi chingTroll chingW CougarHunt DAESuppy dan10 dan7 danBad danCreep danCringe danCry danCute danDead danDerp danDuck danGasm danGasp danGrump danHype danLewd danLol danLove danNo danPalm danPoop danRage danRekt danScare danSexy DansGame danThink danTrain danWave danWTF danYay danYes DatSheffy DBstyle DendiFace dewD dewDel dewDitch dewDoge dewDown dewDream dewGloves dewHex dewHS dewJones dewKass dewMad dewSwag dewTowel dewTrain dewUp dewW dewWhip diablousKappa DogFace duckArthas duckBA duckBarrel duckBedHead duckBoop duckCoffee duckDerp duckDuckFlex duckGA duckMama duckParty duckPist duckQuappa duckSad duckSkadoosh duckSpread duckTenTen duckTrain duckZIN EagleEye EleGiggle emoEz emoGlock emoLoser emoRekt emoRufusZ emoSwag emoVorteX emoWoo EvilFetus FailFish FPSMarksman FrankerZ FreakinStinkin FUNgineer FunRun FuzzyOtterOO GasJoker GingerPower GrammarKing HassaanChop HassanChop heroDEEP heroDITCH heroFACEPALM heroNEXT heroSMILE heroWAFFLE HeyGuys HotPokket HumbleLife hydraGREEN hydraHEIL hydraLUNA hydraMURAT hydraPURPLE hydraRUSSIA hydraSquare hydraXMAS ItsBoshyTime jaxer123```",
        "```jaxer4Sheffy jaxerFuzz jaxerGasm jaxerGive jaxerPicnic jaxerPotato Jebaited JKanStyle JonCarnage KAPOW Kappa Keepo KevinTurtle Kippa Kreygasm krippBird krippCat krippChampz krippDoge krippDonger krippDonger2 krippEye krippFist krippGive krippLucky krippOJ krippRage krippRiot krippSheffy krippSleeper krippSuccy krippThump krippToon krippW krippWall krippWTF KZassault KZcover KZguerilla KZhelghast KZowl KZskull leaD leaDinodoge leaDS leaG leaH leaHS leaHug leaK leaKing leaKobe leaL leaLethal leaPedo leaRage leaRIP leaSkal leaSubHorn leaTbirds leaThump lirikAppa lirikB lirikC lirikCLENCH lirikCRASH lirikCRY lirikD lirikDEAD lirikF lirikFAT lirikGasm lirikGOTY lirikH lirikHug lirikHYPE lirikL lirikM lirikMLG lirikNICE lirikO lirikPOOP lirikPVP lirikRage lirikREKT lirikRIP lirikTEN lirikThump lirikTRASH lirikW lirikWc Mau5 mcaT MechaSupes mitch1 mitchAbort mitchCall mitchDewkappa mitchDood mitchDream mitchHi-Yah mitchKamehameha mitchLipstick mitchMitchEw mitchQuest mitchTheLaw mitchTyrone mitchW mitchWW mitchYoloBlock MrDestructoid MVGame NightBat NinjaTroll nmpKerpa nmpNMPbomb nmpSAD nmpSweg nmpTHELORD nmpThump nmpTUDI nmpW NoNoSpot noScope NotAtk OMGScoots OneHand OpieOP OptimizePrime panicBasket PanicVis PazPazowitz PeoplesChamp PermaSmug PicoMause pingApproves pingCoon pingKappa pingNana pingOh pingShiny pingStar pingW PipeHype PJHarley PJSalt PMSTwin PogChamp Poooound PraiseIt PRChase primeBeard primeCoin primeFeel primeKappa primeLaugh primeLoot primeScum primeSquid PunchTrees PuppeyFace RaccAttack RalpherZ reckCry reckD reckDDOS reckDealer reckFarmer reckHello reckJenna reckJew reckRiot reckS reckSleeper reckSND reckT reckTime reckW RedCoat```",
        "```ResidentSleeper RitzMitz rukiAdult rukiAmigo rukiBuddy rukiCanadaEh rukiCreep rukiCry rukiDerp rukiDownGoes rukiDoYou rukiGasm rukiHarryKappa rukiPunch rukiSmug rukiTea rukiWizRuki rukiWot RuleFive sdzParty sdzThirsty sdzTmnt sdzTreebeard Shazam shazamicon ShazBotstix ShibeZ SMOrc SMSkull snutzAmigo snutzBear snutzChika snutzFDB snutzGasm snutzHorse snutzHype snutzLove snutzMoney snutzPaladin snutzRamen snutzTrain snutzTurtle snutzWub SoBayed sodaAwkward sodaB sodaBAM sodaBD sodaBibleThump sodaBJP sodaBT sodaC sodaCRINGE sodaDEAL sodaDI sodaDOGE sodaDS sodaDU sodaFP sodaG sodaGASM sodaGG sodaGive sodaGS sodaHeyGuys sodaHYPE sodaIMAPELICAN sodaKappa sodaKYLE sodaMicMuted sodaMLG sodaNOPE sodaPETA sodaPYAH sodaRB sodaREKT sodaRIOT sodaRIP sodaROGER sodaSENPAI sodaTD sodaUpist sodaW sodaWELCOME sodaWH SoonerLater SriHead SSSsss StoneLightning StrawBeary SuperVinlin SwiftRage talbFace talbHappy talbLewd talbSad talbSloth talbTroll talbWheresbyron taureHartz taureKommerz taureMic taureSchimmel taureSnipe taureUSB TF2John thatBob thatDemMelons thatKawaii thatLOL thatScumbag thatSwine thatThirst thatWhiteKnight TheRinger TheTarFu TheThing ThunBeast TinyFace TooSpicy towAim towBANNED towBeer towBolvar towByah towDerp towHAMUP towJesus towJoe towKappa towOface towPalm towPoop towRage towRekt towRip towShappens towShots towSkinTowel towThump towTrain towVACBOSS towW towWtf TriHard TTours UleetBackup UncleNox UnSane vanGoHAM vanHOJ vanKwok vanWings Volcania WholeWheat WinWaker woundBomb woundFace woundGasm woundGrin woundJJ woundOil WTRuck WutFace xentiBox xentiRBG xentiSabotage xentiShrimp YouWHY```"
      ]);*/
      sendMessages(e, ["I can't do that in this channel"]);
    }
  },
  lisths: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      /* sendMessages(e, ["**Listing all emotes what I know: **"]);
      sendMessages(e, ["**Listing all homestuck emotes what I know: "]);
      sendMessages(e, ["```abandonthread adventuretime angrykanaya angrykarkat angryrose angryvriska animedave animekat aradiasmile araneaglare araneaohshit araneaswoon areyounext arm arquius ballpit bladekind blap blueslimer boredjade bro bucketfaced caliborndazed calibornohshit calibornswoon calliehappy crainbow creepyaradia crotchstare dafuq damarasmoke dave daveannoyed daveno dawww dirkhungover dirksad dirkwtf disapproval docfacepalm doze drunkass drunkrose dutton egbertkick equius equiusponder everybodyout eviljane eyewear facepaw feferi fixthis fuckfuckfuck fuckingincredible fuckno gamzeeohshit gamzeeslice gamzeewave gamzeewtf geromy halfhat happyjohn hat highfive hjeff horussomgyes hugs hussie igiveup jackbluh jackdwi jack_ jadeglare jadeswoon jakejane jakeno jakeomg jane janebackup janeblush janestare janewtf johnbluh johnbreakdown johncry johnderp johneyeroll johnfacepalm johnfistshake johngulp johnheart johnno johnnope johnstaredown johnstupid johntantrum johnuhh johnvictory kanaya kanayacry kanayaeyeroll kankriwhistle karkatbreakdown karkatchair karkatdaveohshit karkatfacepalm keepingitreal kksad kkwtf lilcal meenahswoon meenahugh meenahwankwank mituna mitunafall mitunasad moustachefire mspa mustachefire nepetahappy nohat obvious ohdeargod philosofrog phweet pissedjade pissedkanaya plotthicken pumpkin roseeyebrows rosefacepalm roseintrigued roseohno roseoof roserofl roxycry roxyderp roxysad roxyswoon rufiohwhoa saccharinedisposition sadjane sbahjgoddamn sbahjhehehe sbahjstfu sbro shenanigans smartass sobored spacer splrrr storytime stupid sup sweetcatch tavrosfacepalm terezifacepalm tereziglare terezipoint terezi_ theresproblems tricksterjane trollsonatime vriska vriskashoosh vriskaswoon wakeupcall weredoingthisman whatnow wrinklefucker wtf yeahdogg youremfwelcome yourewelcome```"]);
    */
      sendMessages(e, ["I can't do that in this channel"]);
    }
  },
  help: {
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
      sendMessages(e, ["**Commands I know: **", "```reddit/subreddit <arguments> - posts a random image from /hot of that subreddit\nkemo - posts a random image with kemonomimi\nid - returns the id of the channel\njson - returns a formated json of your message\nmyid - returns your id\nbat - how to run a bat file if you don't know\nemote <argument> - posts an emote\nhelp - shows this silly```"]);
    }
  },
  come: {
    permission: {
      group: ["dev"],
      onlyMonitored: false
    },
    action: function(args, e) {
      if (e.db.channels.indexOf(e.channelID) != -1) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "Silly, I am already here :3"
        });
        return;
      }
      e.db.channels.push(e.channelID);
      if (database.isUserInGroup(e.userID, "waifu")) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "Your Waifu is here now \u2764"
        });
      } else {
        e.bot.sendMessage({
          to: e.channelID,
          message: "I am here now and will listen to all of your commands \u2764"
        });
      }


      e.db.saveConfig();
    }
  },
  leave: {
    permission: {
      group: ["dev"],
      onlyMonitored: true
    },
    action: function(args, e) {
      if (e.db.channels.indexOf(e.channelID) == -1) {
        return;
      }
      e.db.channels.splice(e.db.channels.indexOf(e.channelID), 1);
      e.db.saveConfig();
      e.bot.sendMessage({
        to: e.channelID,
        message: "I will leave this channel now ;_;"
      });
    }
  },
  json: {
    permission: {
      uid: [config.masterID],
      group: ["dev"],
      onlyMonitored: true
    },
    action: function(args, e) {
      sendMessages(e, ["```" + JSON.stringify(e.rawEvent, null, '\t').replace(/`/g, '\u200B`') + "```"]);
    }
  },
  love: {
    permission: {
      uid: [config.masterID],
      group: ["waifu"],
      onlyMonitored: true
    },
    action: function(args, e) {
      sendMessages(e, ["<@" + e.userID + "> \u2764"]);
    }
  },
  group: require("./command_group.js"),
  //TODO load a database with multiple greetings, like how images are done but with an array of messages for every greeting
  greet: require("./command_greet.js"),
  info: {
    permission: {
      uid: [config.masterID],
      onlyMonitored: true
    },
    action: function(args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      sendMessages(e, ["My current status is:\nMy current version is: `" + VERSION + "`\nI been awake since `" + tm(startTime) + "`\nI am in `" + MODE + "` mode right now.\nMy current uptime in seconds is: `" + t + "`\nZephy is the best developer \u2764"]);
    }
  },
  debug: {
    permission: {
      uid: [config.masterID],
      onlyMonitored: true
    },
    action: function(args, e) {
      if (args[0] == "info") sendMessages(e, ["My current status is:\nI am running on version: `" + VERSION + "`\nI been awake since `" + tm(startTime) + "`\nI am in `" + MODE + '` mode right now.'])
    }
  }
}

bot.on('message', processMessage);

bot.on("presence", function(user, userID, status, rawEvent) {
  /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function(rawEvent) {
  /*console.log(rawEvent)*/ //Logs every event
});

bot.on("disconnected", function() {
  console.log("Bot disconnected");
  bot.connect(); //Auto reconnect
});

/*Function declaration area*/
function sendMessages(e, messageArr, interval) {
  var callback, resArr = [],
    len = messageArr.length;
  typeof(arguments[2]) === 'function' ? callback = arguments[2]: callback = arguments[3];
  if (typeof(interval) !== 'number') interval = 1000;

  function _sendMessages() {
    setTimeout(function() {
      if (messageArr[0]) {
        e.bot.sendMessage({
          to: e.channelID,
          message: messageArr.shift()
        }, function(res) {
          resArr.push(res);
          if (resArr.length === len)
            if (typeof(callback) === 'function') callback(resArr);
        });
        _sendMessages();
      }
    }, interval);
  }
  _sendMessages();
}

function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb); // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

function processMessage(user, userID, channelID, message, rawEvent) {
  console.log("-----------");
  console.log("Got message: '" + message.replace(/[^A-Za-z0-9 ]/, '?') + "' on channel '" + channelID.replace(/[^A-Za-z0-9 ]/, '?') + "' from '" + user + "' (" + userID.replace(/[^A-Za-z0-9 ]/, '?') + ")");

  if (userID == bot.id) {
    return;
  }

  var parsed = parse(message);
  if (!parsed) {
    //console.log("Not a command");
    return;
  }

  if (parsed.command == "eval") {
    if (userID != config.masterID) {
      bot.sendMessage({
        to: channelID,
        message: "<@" + userID + "> Only Zephy can use that command!"
      });
      return;
    }
    try {
      bot.sendMessage({
        to: channelID,
        message: "```" + eval(message.substring(config.listenTo.length + 3).substring(message.indexOf(" "))) + "```"
      });
    } catch (e) {
      bot.sendMessage({
        to: channelID,
        message: "Something went wrong! \n\n```" + e.message + "```"
      });
    }
    return;
  }

  if (!canUserRun(parsed.command, userID, channelID)) {
    console.log("User cant run this command");
    return;
  }

  if (commands[parsed.command]) {
    if (commands[parsed.command].cooldown) {
      if ((new Date()).getTime() - commands[parsed.command].lastTime < commands[parsed.command].cooldown) {
        bot.sendMessage({
          to: channelID,
          message: "<@" + userID + "> you are doing that too fast!"
        });
        bot.deleteMessage({
          channel: channelID,
          messageID: rawEvent.d.id
        });
        return;
      }
    }
    commands[parsed.command].action(parsed.args, {
      "user": user,
      "userID": userID,
      "channelID": channelID,
      "rawEvent": rawEvent,
      "bot": bot,
      "db": database
    });
    commands[parsed.command].lastTime = (new Date()).getTime();
  }
}

function parse(string) {
  /*if (string.charAt(0) != '~') {
    return false;
  }*/

  var pieces = string.split(" ");
  if (pieces[0].toLowerCase() != config.listenTo) {
    return false
  }
  if (pieces[1] === undefined) return null;
  if (pieces[1] === "\u2764") pieces[1] = "love"; //ech, used for love command because the receives a heart shaped character

  /*pieces[0] = pieces[0].slice(config.username.length, pieces[0].length);*/
  //console.log(pieces.slice(1, pieces.length));
  return {
    command: pieces[1].toLowerCase(),
    args: pieces.slice(2, pieces.length)
  };
}


function canUserRun(command, uid, channelID) {

  if (!commands[command]) {
    if (database.channels.indexOf(channelID) == -1) {
      return false;
    }
    if (database.messages[command]) {
      return true;
    }
    if (database.images[command]) {
      return true;
    }
    return false;
  }

  if (!commands[command].permission) {
    if (database.channels.indexOf(channelID) != -1) {
      return true;
    } else {
      return false;
    }
  }

  if (commands[command].permission.onlyMonitored) {
    if (database.channels.indexOf(channelID) == -1) {
      return false;
    }
  }

  if (!commands[command].permission.uid && !commands[command].permission.group) {
    return true;
  }

  if (commands[command].permission.uid) {
    for (var i = 0; i < commands[command].permission.uid.length; i++) {
      if (uid == commands[command].permission.uid[i]) {
        return true;
      }
    }
  }

  if (commands[command].permission.group) {
    for (var i = 0; i < commands[command].permission.group.length; i++) {
      if (database.isUserInGroup(uid, commands[command].permission.group[i])) {
        return true;
      }
    }
  }

  return false;
}

//TODO IMPLEMENT NSFW FILTERING/CHANNEL
//TODO ANDSWER SOME COMMANDS IN PM e.userID as channelID
function doReddit(args, e) {
  var arguments = args;
  reddit.getSubreddit(arguments, config.redditAdultMode, function(response) {
    e.bot.deleteMessage({
      channel: e.channelID,
      messageID: e.rawEvent.d.id
    });

    if (response != undefined) {

      if (response.NSFW == true && config.redditAdultMode == false) {
        sendMessages(e, ["<@" + e.userID + ">: **I am sorry, I am in SFW mode on this channel and you're trying to get NSFW**"]);
        return;
      }


      var link = response.link.toString();
      link = link.replace(/^https:\/\//i, 'http://');
      var responseReddit = response;
      var filename = "temp/" + link.split("/").pop();
      var file = fs.createWriteStream(filename);
      var request = http.get(link.toString(), function(response) {
        response.pipe(file);
      });
      request.on('close', function() {
        fs.exists(filename, function(exists) {
          if (exists) {
            bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + ">: **I am grabbing a random image from /r/" + args + " for you** \u2764",
              //typing: true
            }, function(response) { //CB Optional
              bot.uploadFile({
                to: e.channelID,
                file: fs.createReadStream(filename)
              }, function(response) { //CB Optional
                bot.sendMessage({
                  to: e.channelID,
                  message: "Title: **" + responseReddit.title + "**",
                  //typing: true
                });
                if (config.deletereddit) fs.unlink(filename);
              });
            });
          }
        });
      });
    } else sendMessages(e, ["<@" + e.userID + ">: **I am sorry, I can't find any image for you on /r/" + args + " ;-;**"]);
  });
}

function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + dt;
}
