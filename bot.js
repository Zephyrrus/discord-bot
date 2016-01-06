/*Variable area*/
var Discordbot = require('discord.io');
var bot = new Discordbot({
  email: "vinylpone@gmail.com",
  password: "INSERT PASSWORD HERE",
  autorun: true
});

var personalRoom = 133337987520921600;
var fs = require('fs');
var kemo = require('./reddit');
var http = require('https');

/*Event area*/
bot.on("err", function(error) {
  console.log(error)
});

bot.on("ready", function(rawEvent) {
  console.log("Connected!");
  console.log("Logged in as: ");
  console.log(bot.username + " - (" + bot.id + ")");
  bot.setPresence({
    idle_since: null,
    game: "Doing fishy stuffs :D"
  });
  bot.editUserInfo({
    password: 'INSERT PASSWORD HERE', //Required
    username: 'Eribot' //Optional
  })
  console.log("Set status!");

});

bot.on("message", function(user, userID, channelID, message, rawEvent) {
  console.log(user + " - " + userID);
  console.log("in " + channelID);
  console.log(message);
  console.log("----------");

  //todo add !shush on {I won't say a thing in this chat again!}
  if ( /*channelID == personalRoom && */ userID != bot.id)
    if (message[0] === '~') {
      var argumentStart = message.indexOf(' ');
      var arguments = null;
      var commandReceived = message;
      if (argumentStart > 0) {
        arguments = message.substr(argumentStart + 1, message.length);
        commandReceived = message.substr(0, argumentStart);
      }
      switch (commandReceived) {
        case '~ping':
          sendMessages(channelID, ["<@" + userID + "> Pong"]);
          console.log("Ponged <@" + userID + ">");
          break;

        case '~r':
          kemo.getKemo(function(response) {
            var filename = "temp\\" + response.split("/").pop();
            var file = fs.createWriteStream(filename);
            console.log(response);
            var request = http.get(response, function(response) {
              response.pipe(file);
            });
						request.on('close', function(){
							bot.uploadFile({
								channel: channelID,
								file: fs.createReadStream(filename)
							}, function(response) { //CB Optional
									fs.unlink(filename);
							});
						});
          });
          break;

        case '~setstatus':
          bot.setPresence({
            idle_since: null,
            game: arguments
          });
          sendMessages(channelID, ["[DEBUG]: RECEIVED !changestatus"]);
          //JSON.stringify({name : "Testing bot!"})
          break;

        case '~id':
          var str = "The ID of this channel is `" + channelID + "`";
          sendMessages(channelID, [str]);
          break;

        case '~json':
          var str = "```" + JSON.stringify(rawEvent, null, '\t').replace(/`/g, '\u200B`') + "```";
          sendMessages(channelID, [str]);
          break;

        case '~echo':
          if (arguments != null) {
            sendMessages(channelID, [arguments]);
          }
          break;

        case '~myid':
          sendMessages(channelID, ["<@" + userID + ">: **Your ID**: `@" + userID + "`"]);
          break;

        case '~bat':
          sendMessages(channelID, ["**Guide from** <@132130219631837184> **to run a bat.**"]);
          setTimeout(function() {
            console.log('sleeping thread');
          }, 500);
          bot.uploadFile({
            channel: channelID,
            file: fs.createReadStream("images\\giphy.gif")
          }, function(response) { //CB Optional
            //console.log(response)
          });
          break;

        case '~emote':
          var path = "images\\emotes\\" + arguments + ".png";
          if (arguments != null) {
            fs.exists(path, function(exists) {
              if (exists) {
                bot.uploadFile({
                  channel: channelID,
                  file: fs.createReadStream(path)
                }, function(response) { //CB Optional
                  //	console.log(response);
                });
                bot.deleteMessage({
                  channel: channelID,
                  messageID: rawEvent.d.id
                });
              } else {
                sendMessages(channelID, ["<@" + userID + ">: **Sorry I don't know that emote right now ;_;**"]);
              }
            });
          }
          break;

        case '~hs':
          var path = "images\\hs\\" + arguments + ".png";
          if (arguments != null) {
            fs.exists(path, function(exists) {
              if (exists) {
                bot.uploadFile({
                  channel: channelID,
                  file: fs.createReadStream(path)
                }, function(response) { //CB Optional
                  //	console.log(response);
                });
                bot.deleteMessage({
                  channel: channelID,
                  messageID: rawEvent.d.id
                });
              } else {
                sendMessages(channelID, ["<@" + userID + ">: **Sorry I don't know that HS emote right now ;_;**"]);
              }
            });
          }
          break;

        case '~list':
          sendMessages(channelID, ["```4Head ANELE ArsonNoSexy AsianGlow AtGL AthenaPMS AtIvy AtWW azaConrad azaDRAIN azaERASED azaFox azaHAPPY azaHHH azaMAD azaRAT BabyRage BatChest BCWarrior BibleThump BigBrother BionicBunion BlargNaut BloodTrail boomerBoomerMosta boomerBoomerStapler boomerDrink boomerGlantz boomerInc boomerKappe boomerKrone boomerMinus boomerPizza boomerSabotage BORT BrainSlug BrokeBack BuddhaBar chingAus chingBday chingBig chingBinbash chingBomb chingEdge chingFace chingHype chingJail chingMaiku chingMod chingMoney chingPanda chingPotato chingS chingSense chingSub chingTgi chingTroll chingW CougarHunt DAESuppydan10 dan7 danBad danCreep danCringe danCry danCute danDead danDerp danDuck danGasm danGasp danGrump danHype danLewd danLol danLove danNo danPalm danPoop danRage danRekt danScare danSexy DansGame danThinkdanTrain danWave danWTF danYay danYes DatSheffy DBstyle DendiFace dewD dewDel dewDitch dewDoge dewDown dewDream dewGloves dewHex dewHS dewJones dewKass dewMad dewSwag dewTowel dewTrain dewUp dewW dewWhipdiablousKappa DogFace duckArthas duckBA duckBarrel duckBedHead duckBoop duckCoffee duckDerp duckDuckFlex duckGA duckMama duckParty duckPist duckQuappa duckSad duckSkadoosh duckSpread duckTenTen duckTrainduckZIN EagleEye EleGiggle emoEz emoGlock emoLoser emoRekt emoRufusZ emoSwag emoVorteX emoWoo EvilFetus FailFish FPSMarksman FrankerZ FreakinStinkin FUNgineer FunRun FuzzyOtterOO GasJoker GingerPower```"]);
          setTimeout(function() {
            console.log('sleeping thread');
          }, 500);
          sendMessages(channelID, ["```GrammarKing HassaanChop HassanChop heroDEEP heroDITCH heroFACEPALM heroNEXT heroSMILE heroWAFFLE HeyGuys HotPokket HumbleLife hydraGREEN hydraHEIL hydraLUNA hydraMURAT hydraPURPLE hydraRUSSIA hydraSquarehydraXMAS ItsBoshyTime jaxer123 jaxer4Sheffy jaxerFuzz jaxerGasm jaxerGive jaxerPicnic jaxerPotato Jebaited JKanStyle JonCarnage KAPOW Kappa Keepo KevinTurtle Kippa Kreygasm krippBird krippCat krippChampkrippDoge krippDonger krippDonger2 krippEye krippFist krippGive krippLucky krippOJ krippRage krippRiot krippSheffy krippSleeper krippSuccy krippThump krippToon krippW krippWall krippWTF KZassault KZcoverKZguerilla KZhelghast KZowl KZskull leaD leaDinodoge leaDS leaG leaH leaHS leaHug leaK leaKing leaKobe leaL leaLethal leaPedo leaRage leaRIP leaSkal leaSubHorn leaTbirds leaThump lirikAppa lirikB lirikClirikCLENCH lirikCRASH lirikCRY lirikD lirikDEAD lirikF lirikFAT lirikGasm lirikGOTY lirikH lirikHug lirikHYPE lirikL lirikM lirikMLG lirikNICE lirikO lirikPOOP lirikPVP lirikRage lirikREKT lirikRIPlirikTEN lirikThump lirikTRASH lirikW lirikWc Mau5 mcaT MechaSupes mitch1 mitchAbort mitchCall mitchDewkappa mitchDood mitchDream mitchHi-Yah mitchKamehameha mitchLipstick mitchMitchEw mitchQuest```"]);
          setTimeout(function() {
            console.log('sleeping thread');
          }, 500);
          sendMessages(channelID, ["```mitchTheLaw mitchTyrone mitchW mitchWW mitchYoloBlock MrDestructoid MVGame NightBat NinjaTroll nmpKerpa nmpNMPbomb nmpSAD nmpSweg nmpTHELORD nmpThump nmpTUDI nmpW NoNoSpot noScope NotAtk OMGScoots OneHandOpieOP OptimizePrime panicBasket PanicVis PazPazowitz PeoplesChamp PermaSmug PicoMause pingApproves pingCoon pingKappa pingNana pingOh pingShiny pingStar pingW PipeHype PJHarley PJSalt PMSTwin PogChampPoooound PraiseIt PRChase primeBeard primeCoin primeFeel primeKappa primeLaugh primeLoot primeScum primeSquid PunchTrees PuppeyFace RaccAttack RalpherZ reckCry reckD reckDDOS reckDealer reckFarmerreckHello reckJenna reckJew reckRiot reckS reckSleeper reckSND reckT reckTime reckW RedCoat ResidentSleeper RitzMitz rukiAdult rukiAmigo rukiBuddy rukiCanadaEh rukiCreep rukiCry rukiDerp rukiDownGoesrukiDoYou rukiGasm rukiHarryKappa rukiPunch rukiSmug rukiTea rukiWizRuki rukiWot RuleFive sdzParty sdzThirsty sdzTmnt sdzTreebeard Shazam shazamicon ShazBotstix ShibeZ SMOrc SMSkull snutzAmigo snutzBearsnutzChika snutzFDB snutzGasm snutzHorse snutzHype snutzLove snutzMoney snutzPaladin snutzRamen snutzTrain snutzTurtle snutzWub SoBayed sodaAwkward sodaB sodaBAM sodaBD sodaBibleThump sodaBJP sodaBT sodaC```"]);
          setTimeout(function() {
            console.log('sleeping thread');
          }, 500);
          sendMessages(channelID, ["```sodaCRINGE sodaDEAL sodaDI sodaDOGE sodaDS sodaDU sodaFP sodaG sodaGASM sodaGG sodaGive sodaGS sodaHeyGuys sodaHYPE sodaIMAPELICAN sodaKappa sodaKYLE sodaMicMuted sodaMLG sodaNOPE sodaPETA sodaPYAH sodaRBsodaREKT sodaRIOT sodaRIP sodaROGER sodaSENPAI sodaTD sodaUpist sodaW sodaWELCOME sodaWH SoonerLater SriHead SSSsss StoneLightning StrawBeary SuperVinlin SwiftRage talbFace talbHappy talbLewd talbSadtalbSloth talbTroll talbWheresbyron taureHartz taureKommerz taureMic taureSchimmel taureSnipe taureUSB TF2John thatBob thatDemMelons thatKawaii thatLOL thatScumbag thatSwine thatThirstthatWhiteKnight TheRinger TheTarFu TheThing ThunBeast TinyFace TooSpicy towAim towBANNED towBeer towBolvar towByah towDerp towHAMUP towJesus towJoe towKappa towOface towPalm towPoop towRage towRekt towRiptowShappens towShots towSkinTowel towThump towTrain towVACBOSS towW towWtf TriHard TTours UleetBackup UncleNox UnSane vanGoHAM vanHOJ vanKwok vanWings Volcania WholeWheat WinWaker woundBomb woundFacewoundGasm woundGrin woundJJ woundOil WTRuck WutFace xentiBox xentiRBG xentiSabotage xentiShrimp YouWHY```"]);
          setTimeout(function() {
            console.log('sleeping thread');
          }, 500);
          break;

        default:
          var str = "[DEBUG: COMMAND]\n\n**Received command** `" + commandReceived + "` \n**with arguments** `" + arguments + "` \n**Sender ID**: `@" + userID + "`";
          sendMessages(channelID, [str]);
          break;

      }
    }


  if (message === "!changename") {
    bot.editUserInfo({
      password: 'INSERT PASSWORD HERE', //Required
      username: 'EridanBot' //Optional
    });
  }
});

bot.on("presence", function(user, userID, status, rawEvent) {
  /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function(rawEvent) {
  /*console.log(rawEvent)*/ //Logs every event
});

bot.on("disconnected", function() {
  console.log("Bot disconnected");
  /*bot.connect()*/ //Auto reconnect
});

/*Function declaration area*/
function sendMessages(ID, messageArr, interval) {
  var callback, resArr = [],
    len = messageArr.length;
  typeof(arguments[2]) === 'function' ? callback = arguments[2]: callback = arguments[3];
  if (typeof(interval) !== 'number') interval = 1000;

  function _sendMessages() {
    setTimeout(function() {
      if (messageArr[0]) {
        bot.sendMessage({
          to: ID,
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

function sendFiles(channelID, fileArr, interval) {
  var callback, resArr = [],
    len = fileArr.length;
  typeof(arguments[2]) === 'function' ? callback = arguments[2]: callback = arguments[3];
  if (typeof(interval) !== 'number') interval = 1000;

  function _sendFiles() {
    setTimeout(function() {
      if (fileArr[0]) {
        bot.uploadFile({
          to: channelID,
          file: require('fs').createReadStream(fileArr.shift())
        }, function(res) {
          resArr.push(res);
          if (resArr.length === len)
            if (typeof(callback) === 'function') callback(resArr);
        });
        _sendFiles();
      }
    }, interval);
  }
  _sendFiles();
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
