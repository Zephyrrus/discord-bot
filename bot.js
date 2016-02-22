var startTimeMs = new Date();
/*Variable area*/
const VERSION = require("./package.json").version;
const BRANCH = "Database branch";
var MODE = "production";
var Discordbot = require('discord.io');
var fs = require('fs');
var http = require('http');
var logger = require("winston");
var commandRegister = require("./commandRegister");
var command = new commandRegister();

process.argv.forEach(function (val, index, array) {
  if (val === "development") MODE = "development";
});

if (MODE === "production") {
  var config = require('./configs/config.json');
  var auth = require('./configs/auth.json'); // or remove ./ for absolute path ^_^
} else {
  var config = require('./configs/config_dev.json');
  var auth = require('./configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}

GLOBAL.MODE = MODE;
var bot = new Discordbot({
  email: auth.discord.email,
  password: auth.discord.password,
  autorun: true
});
var startTime = Math.round(new Date() / 1000);

var uidFromMention = /<@([0-9]+)>/;

var database = new(require("./database.js"))();
var away = [];

////
var webConnecter = require("./modules/web/webModule.js");
////
/*var myCustomLevels = {
   levels: {
     message: 4,
     discordpm: 4
   },
   colors: {
     message: 'cyan',
     discordpm: 'yellow'
   }
 };*/
//logger.addColors(myCustomLevels.colors);
var t = startTimeMs.toISOString().replace(/[:.]/gi, '-');
var fname = './log/' + t + '.log';
try {
    fs.mkdirSync('./log');
} catch(e) {

}

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {colorize: true});
logger.add(logger.transports.File, {
    level: 'debug',
    filename: fname
});
logger.level = 'debug';
/*----------------------------------------------*/
/*Event area*/
bot.on("err", function (error) {
  logger.error(error)
});

bot.on("ready", function (rawEvent) {
  if (!fs.existsSync("./modules/cache")){
    fs.mkdirSync("./modules/cache");
  }
  if (MODE == "development") {
    logger.info("Sending log in information to discord.");
    bot.editUserInfo({
      password: auth.discord.password, //Required
      username: config.username //Optional
    });
    //commands['waifu'] = require("./modules/waifu/module_waifu.js");
  }
  logger.info("Connected!");
  logger.info("Logged in as: ");
  logger.info(bot.username + " - (" + bot.id + ")");
  logger.info("Listento: " + config.listenTo);
  bot.setPresence({
    idle_since: null,
    game: config.defaultStatus
  });
  logger.info("Version: " + VERSION + " ~ " + BRANCH);
  logger.info("Set status!");
  var web = webConnecter({
    "bot": bot,
    "database": database,
    "config": config,
    "logger": logger,
    "botStatus": {
      "startTime": startTime,
      "cooldown": config.globalcooldown,
      "nsfwFilter": config.allowNSFW
    }
  }, bot);
  var startupTime = Math.round((new Date()).getTime() - startTimeMs);
  command.addModule(require("./modules/module_kitten.js"));
  logger.info(`It took ${startupTime} ms to initialize the bot.`)
});

/*----------------------------------------------*/

var commands = {
  ping: {
    category: "misc",
    description: "ping - the bot will reply with 'Pong!' and later with the delay between discord and the server",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function (args, e) {
      var delayStart = new Date().getTime();
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Pong"
      }, function (error, response) {
        var delay = Math.round((new Date()).getTime() - delayStart);
        bot.editMessage({
          channel: response.channel_id,
          messageID: response.id,
          message: "<@" + e.userID + "> Pong\nNetwork delay: **" + delay + "** ms"
        }, function (error, response) {
          //console.log(response);
        });
      });
      logger.debug("Ponged <@" + e.userID + ">");
    }
  },
  status: {
    category: "management",
    permission: {
      uid: [config.masterID],
      onlyMonitored: true,
      group: ['dev', 'waifu'],
    },
    action: function (args, e) {
      e.bot.setPresence({
        idle_since: null,
        game: args.join(" ")
      });
    }
  },
  id: {
    category: "info",
    description: "id <myid|channel|server|@mention> - shows the id of the requested channel/user/etc ",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      if (args[0])
        if (args[0].toLowerCase() == "channel") {
          sendMessages(e, ["The ID of this channel is `" + e.channelID + "`"]);
        } else if (args[0].toLowerCase() == "server") {
        e.bot.sendMessage({
          to: e.channelID,
          message: "Server ID => `" + e.bot.serverFromChannel(e.channelID) + "`"
        });
      } else if (args[0].indexOf("<@") > -1 && args[0].indexOf(">") > -1) {
        e.bot.sendMessage({
          to: e.channelID,
          message: args[0] + " `" + args[0].substring(2, args[0].length - 1) + "`"
        });
      } else {
        sendMessages(e, ["<@" + e.userID + ">: **Your ID**: `@" + e.userID + "`"]);
      }
    }
  },
  echo: {
    category: "misc",
    description: "echo - the bot will repeat your message.",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function (args, e) {
      if (!args[0]) {
        return;
      }
      if (args[0].toLowerCase() == "-h") {
        args.splice(args[0], 1);
        sendMessages(e, [args.join(" ")]);
      } else {
        sendMessages(e, [args.join(" ") + " [<@" + e.userID + ">]"]);
      }
      e.bot.deleteMessage({
        channel: e.channelID,
        messageID: e.rawEvent.d.id
      });
    }
  },
  bat: {
    category: "misc",
    description: "bat - how to run a bat file if you don't know",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function (args, e) {
      sendMessages(e, ["**Guide from** <@132130219631837184> **to run a bat.**"]);
      bot.uploadFile({
        to: e.channelID,
        file: fs.createReadStream("images/giphy.gif")
      }, function (error, response) {

      });
    }
  },
  emote: {
    category: "entertainment",
    description: "emote <argument> - posts an emote",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function (args, e) {
      if (!args[0]) {
        return;
      }
      if (e.db.images[args[0].toLowerCase()]) {
        e.bot.deleteMessage({
          channel: e.channelID,
          messageID: e.rawEvent.d.id
        });
        bot.uploadFile({
          to: e.channelID,
          file: database.images[args[0].toLowerCase()]
        })
      } else {
        sendMessages(e, ["<@" + e.userID + ">: **Sorry I don't know that twitch emote right now ;_;**\nMessage Zephy and let him know that you want it added."]);
      }
    }
  },
  help: {
    category: "info",
    description: "help - shows this silly",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function (args, e) {
      var userInGroups = [];
      for (var grp in e.db.groups) {
        if (e.db.groups[grp].indexOf(e.userID) > -1) {
          userInGroups.push(grp);
        }

      }
      if (userInGroups.length == 0)
        userInGroups.push("");

      function pushCommand(array, cmd) {
        //logger.debug(cmd + " - " + commands[cmd].category);
        if (commands[cmd].category != undefined) {
          array[commands[cmd].category] = array[commands[cmd].category] || [];
          array[commands[cmd].category].push(cmd);
        } else {
          array['uncategorized'] = array['uncategorized'] || [];
          array['uncategorized'].push(cmd);
        }
      }
      /* COMMANDS ADDING TO THE OBJECT */
      var queryResult = {};
      for (var cmd in commands) {
        if (commands[cmd]) {
          if (commands[cmd].hidden == undefined || commands[cmd].hidden == false)
            if (commands[cmd].permission.group != undefined && commands[cmd].permission.uid == undefined) {
              if ((commands[cmd].permission.group.indexOf(userInGroups[0]) > -1)) {
                pushCommand(queryResult, cmd);

              }
            } else if (commands[cmd].permission.uid != undefined && commands[cmd].permission.uid == e.userID) {
            pushCommand(queryResult, cmd);
          } else if (commands[cmd].permission.uid == undefined) {
            pushCommand(queryResult, cmd);
          }
        } else logger.error("Unknown error when registering the following command: " + cmd);
      }

      /* SORTING */
      /* NO SORTING BECAUSE JS */

      /* HELP MESSAGE GENERATING */
      //queryResult = queryResult.sort();
      var helpMessage = "All commands are prefixed with `" + config.listenTo + "`\n**Allowed commands: **\n\n";
      for (var category in queryResult) {
        helpMessage += "**" + category.toString() + "**\n";
        for (var command in queryResult[category]) {
          if (commands[queryResult[category][command]].description != undefined) {
            if (commands[queryResult[category][command]].description instanceof Array) {
              for (var i = 0; i < commands[queryResult[category][command]].description.length; i++) { // this is used when the module has an array of commands
                helpMessage += "\t" + commands[queryResult[category][command]].description[i] + "\n"
              }
            } else {
              helpMessage += "\t" + commands[queryResult[category][command]].description + "\n" // this is used when the module has a single command
            }
          } else {
            if (queryResult[command] == undefined) {
              logger.error(command + " - " + queryResult[category][command] + " - " + category);
            }
            helpMessage += "\t" + queryResult[category][command] + " - No description\n" // this is used when a module has no command descriptions declared
          }
        }
        helpMessage += "\n";
      }
      helpMessage += "\nThere might be some more commands. Either I forgot to add them to this list, or they require certain permissions.";

      if (e.bot.serverFromChannel(e.channelID) != undefined) e.bot.sendMessage({
        to: e.channelID,
        message: "Please check your private messages for the commands."
      })
      recursiveSplitMessages(e, e.userID, helpMessage);
      /*e.bot.sendMessage({
        to: e.userID,
        message: helpMessage + "```\nThere might be some more commands. Either I forgot to add them to this list, or they require certain permissions."
      });*/
    }


  },
  come: {
    category: "management",
    description: "come - starts listening to the current channel and will answer commands",
    permission: {
      group: ["dev"],
      onlyMonitored: false
    },
    action: function (args, e) {
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


      e.db.saveConfig("channels");
    }
  },
  leave: {
    category: "management",
    description: "leave - stops listening to the current channel",
    permission: {
      group: ["dev"],
      onlyMonitored: true
    },
    action: function (args, e) {
      if (e.db.channels.indexOf(e.channelID) == -1) {
        return;
      }
      e.db.channels.splice(e.db.channels.indexOf(e.channelID), 1);
      e.db.saveConfig("channel");
      e.bot.sendMessage({
        to: e.channelID,
        message: "I will leave this channel now ;_;"
      });
    }
  },
  json: {
    category: "management",
    description: "json - shows a formated json of the response received from the server",
    permission: {
      uid: [config.masterID],
      group: ["dev"],
      onlyMonitored: true
    },
    action: function (args, e) {
      sendMessages(e, ["```" + JSON.stringify(e.rawEvent, null, '\t').replace(/`/g, '\u200B`') + "```"]);
    }
  },
  love: {
    category: "misc",
    hidden: true,
    permission: {
      /*uid: [config.masterID],
      group: ["waifu"],*/
      onlyMonitored: true
    },
    action: function (args, e) {
      sendMessages(e, ["<@" + e.userID + "> \u2764 I love you"]);
    }
  },
  waifu: {
    category: "entertainment",
    description: "waifu me - gives you a random waifu",
    permission: {
      onlyMonitored: true
    },
    helper: require("./modules/waifu/module_waifu.js"),
    action: function (args, e) {
      if(e.userID == "108272892197806080") sendMessages(e, ["I am your waifu \u2764\u203F\u2764"]);
      else {
        this.helper.action(args, e);
      }
      var random = Math.floor(Math.random() * (50 - 1) + 1);;
      if (random % 5 == 0) {
        sendMessages(e, ["Do you want to make a contract ? ／人◕ ‿‿ ◕人＼"]);
      }
    }
  },
  info: {
    category: "info",
    description: "info - shows information about the current status of the bot.",
    permission: {
      uid: [config.masterID],
      group: ["dev"],
      onlyMonitored: true
    },
    action: function (args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      if (args[0].toLowerCase() == "zombie") {
        sendMessages(e, ["My status is:\nMy current version is: **" + VERSION + "\n**My current branch is: **" + BRANCH + "**\nI been awake since **" + tm(startTime) + "**\nI am in **" + MODE + "** mode right now.\nMy current uptime is: **" + getUptimeString() + "**\nThe global cooldown is set to **" + config.globalcooldown / 1000 + "** seconds\nZephy is the best developer and I am the best catgirl \u2764\n*whispers* Reddit adult mode filtering is right now set to: **" + !config.allowNSFW + "** (no NSFW if this is true)\nListen to my theme song please \"http://youtube.com/watch?v=neQY2fXqBLM\" :3"]);
        return;
      }
      var nsfw = database.nsfwChannels.indexOf(e.channelID) > -1 ? true : false;
      sendMessages(e, ["My status is:\nMy current version is: **" + VERSION + "\n**\
My current branch is: **" + BRANCH + "**\n\
I been awake since **" + tm(startTime) + "**\n\
I am in **" + MODE + "** mode right now.\n\
My current uptime is: **" + getUptimeString() + "**\n\
The global cooldown is set to **" + config.globalcooldown / 1000 + "** seconds\n\
Zephy is the best developer and I am the best catgirl \u2764\n\
*whispers* Reddit adult mode filtering is right now set to : **" + !nsfw + "** in this channel (no NSFW if this is true)\n\
Listen to my theme song please \"" + config.general.themeSong + "\" :3"]);
    }
  },
  uptime: {
    category: "info",
    description: "uptimes - shows the bot's current uptime",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      e.bot.sendMessage({
        to: e.channelID,
        message: "I been awake since **" + tm(startTime) + "**\nMy current uptime is: **" + getUptimeString() + "**"
      });
    }
  },
  channels: {
    category: "info",
    description: "channels - shows the channels in which the bot is",
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      var result = "**Channels where I am right now:** [Count: **"+database.channels.length +"**]\n```\n"
      for (var i=0; i < database.channels.length; i++){
        result += (i+1 == database.channels.length ? database.channels[i] : database.channels[i] + ",");
      }
      result += "```";
      recursiveSplitMessages(e, e.userID, result);
    }
  },
  module: {
    category: "info",
    description: ["module - lists every loaded module", "module <moduleName> - shows info about the module with that name (if it exists and is loaded)"],
    permission: {
      onlyMonitored: true
    },
    action: function (args, e) {
      if (args[0] != '') {
        //args.splice(0, 1); // get rid of that shit in front of the module name
        var result = "```\nListing information for module [" + args[0] + "]:\n";
        for (var cmd in commands) {

          if (commands[cmd].properties != undefined && commands[cmd].properties.info != undefined) {
            if (commands[cmd].properties.info.moduleName == args[0]) {
              result += "\tModule info: \n"
              result += "\t\tModule name: " + (commands[cmd].properties.info.name || "N/A") + "\n";
              result += "\t\tModule description: " + (commands[cmd].properties.info.description || "N/A") + "\n";
              result += "\t\tModule importance: " + (commands[cmd].properties.info.importance || "N/A") + "\n";
              result += "\t\tModule version: " + (commands[cmd].properties.info.version || "N/A") + "\n";
              result += "\t\tModule author: " + (commands[cmd].properties.info.author || "N/A") + "\n";
              result += "\t\tModule moduleName: " + (commands[cmd].properties.info.moduleName || "N/A") + "\n";
              result += "\tRequires database: " + (commands[cmd].properties.requiresDB || "False") + "\n"
              if (commands[cmd].properties.requiresDB != undefined && commands[cmd].properties.requiresDB == true) {
                result += "\tDatabase structure: \n"
                if (commands[cmd].properties != undefined) {
                  for (var fieldName in commands[cmd].properties.databaseStructure) {
                    result += "\t\t" + fieldName + ":" + JSON.stringify(commands[cmd].properties.databaseStructure[fieldName.toString()]) + "\n";
                  }
                } else {
                  result += "\t\tWarning: This module has the requiredDB flag set to true but no database structure is defined.\n"
                }
              }
              result += "```";
              e.bot.sendMessage({
                to: e.channelID,
                message: result
              });
            }
          }
        }
        return;
      }
        var result = "```\nCurrently loaded modules:\n";
        for (var cmd in commands) {
          if (commands[cmd]) {
            if (commands[cmd].properties !== undefined && commands[cmd].properties.info !== undefined) {
              result += "\t" + (commands[cmd].properties.info.name || "N/A") + " [" + (commands[cmd].properties.info.moduleName || "N/A") + "], " + "v" + (commands[cmd].properties.info.version || "N/A") + " " + "(by " + (commands[cmd].properties.info.author || "N/A") + ")" + "\n";
            }
          }
        }
        result += "``` \n There may be more modules loaded but their header is not properly set"
        e.bot.sendMessage({
          to: e.channelID,
          message: result
        });

    }
  },
  database: {
    category: "debug",
    description: "database - YOU SHALL NOT TOUCH THIS COMMAND... SERIOUSLY",
    permission: {
      uid: [config.masterID],
      onlyMonitored: true
    },
    action: function (args, e) {

      var databaseStructure = [
        { name: "id", type: "autonumber", primaryKey: true },
        { name: "text", type: "string", required: true}
      ]
      if (args[0] == "dumptable") {
        var dbHandlerInstance = new databaseHandler(args[1]);
        dbHandlerInstance.list(function (err, res) {
          if (err) {
            recursiveSplitMessages(e, e.channelID, "ERRRRRRRR: " + JSON.stringify(err, null, '\t'));
            return;
          }
          recursiveSplitMessages(e, e.channelID, JSON.stringify(res, null, '\t'));
        });

      } else if (args[0] == "find") {
        var dbHandlerInstance = new databaseHandler(args[1]);
        dbHandlerInstance.find(commands['nightcore'].properties.databaseStructure, [{ "name": args[2], "equals": args[3] }], function (err, res) {
          if (err) {
            recursiveSplitMessages(e, e.channelID, "ERRRRRRRR: " + JSON.stringify(err, null, '\t'));
            return;
          }
          recursiveSplitMessages(e, e.channelID, JSON.stringify(res, null, '\t'));
        });
      } else if(args[0]=="migrate"){
        /*var database = new(require("./modules/database/databaseHandler.js"))('nightcore', databaseStructure);
        var count = 0;
        for (var child in e.db.nightcores) {
          database.add([{ "youtubeID": child }, { "title": e.db.nightcores[child].title }, { "addedDate": e.db.nightcores[child].addedBy }, { "addedBy": e.db.nightcores[child].addedBy }, {"tags": e.db.nightcores[child].tags}], function (err, res) {
            if (err) return (logger.error(err));
            count++;
          });
          count++;
        }
        e.bot.sendMessage({
          to: e.channelID,
          message: `<@${e.userID}> Finished migrating ${count} element from the **${args[1]}** database `
        });*/
      }else if (args[0]=="add"){
        var database = new(require("./modules/database/databaseHandler.js"))('sqlinject', databaseStructure);
        if(args[1]){
          database.add([{ "text": args[1] }], function (err, res) {
            if (err) return (printError(e.channelID, err));
            else printError(e.channelID, res);
          });
        }
      }
    }
  },
  avatar: {
    category: "misc",
    description: "avatar - shows your avatar",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e){
      if (!uidFromMention.test(args[0])) {
        e.bot.sendMessage({
          to: e.channelID,
          message: `<@${e.userID}> This is your current avatar:\nhttps://cdn.discordapp.com/avatars/${e.userID}/${e.rawEvent.d.author.avatar}.jpg`
        });
        return;
      }

      try{
        var mentionedUser = uidFromMention.exec(args[0])[1];
        e.bot.sendMessage({
          to: e.channelID,
          message: `<@${e.userID}> This is the mentioned user's current avatar:\nhttps://cdn.discordapp.com/avatars/${mentionedUser}/${e.rawEvent.d.mentions[0].avatar}.jpg`
        });
      }catch(e){

      }
      return;
    }
  },
  //modules
  dance: require('./modules/module_personality.js').dance,
  slap: require('./modules/module_personality.js').slap,
  group: require("./modules/module_group.js"),
  greet: require("./modules/module_greetings.js"),
  message: require("./modules/module_message.js"),
  nightcore: require("./modules/module_nightcore.js"),
  '9gag': require("./modules/module_9gag.js"),
  //kitten: require("./modules/module_kitten.js"),
  anime: require("./modules/module_animedb.js"),
  reddit: require("./modules/module_reddit.js"),
  osu: require("./modules/module_osu.js"),
  encode: require("./modules/module_hashing.js").encode,
  decode: require("./modules/module_hashing.js").decode,
  admin: require("./modules/module_banning.js").ban,
  flip: require("./modules/module_flip.js"),
  remind: require("./modules/module_reminder.js"),
  convert: require("./modules/module_baseconvert.js"),
  password: require('./modules/module_grabpassword.js'),
  leet: require('./modules/module_leet.js'),
  "8ball": require("./modules/module_personality.js").ball,
  bomb: require("./modules/module_bomb.js"),
  size: require("./modules/module_fun.js").size,
  zero: require("./modules/module_zero.js"),
  da: require("./modules/module_deviantart.js"),
  e621: require("./modules/module_e621.js"),
  bash: require("./modules/module_bash.js")

}

bot.on('message', processMessage);

bot.on("presence", function (user, userID, status, rawEvent) {
  /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function (rawEvent) {
  //console.log(rawEvent) //Logs every event
});

bot.on("disconnected", function () {
  logger.error("Bot disconnected");
  bot.connect(); //Auto reconnect
});

/*Function declaration area*/
function sendMessages(e, messageArr, interval) {
  var callback, resArr = [],
    len = messageArr.length;
  typeof (arguments[2]) === 'function' ? callback = arguments[2]: callback = arguments[3];
  if (typeof (interval) !== 'number') interval = 1000;

  function _sendMessages() {
    setTimeout(function () {
      if (messageArr[0]) {
        e.bot.sendMessage({
          to: e.channelID,
          message: messageArr.shift()
        }, function (err, res) {
          resArr.push(res);
          if (resArr.length === len)
            if (typeof (callback) === 'function') callback(resArr);
        });
        _sendMessages();
      }
    }, interval);
  }
  _sendMessages();
}

function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb); // close() is async, call cb after close completes.
    });
  }).on('error', function (err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};


function processMessage(user, userID, channelID, message, rawEvent) {
  if (bot.serverFromChannel(channelID) == undefined) {
    logger.verbose("PRIVATE MESSAGE: [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, ''));

  } else {
    logger.verbose("MESSAGE: (" + bot.fixMessage("<#" + channelID + ">") + ") [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, '') + (rawEvent.d.attachments[0] !== undefined ? "[attachments: " + rawEvent.d.attachments[0].url + " ]":""));
  }
  if (userID == bot.id) {
    return;
  }

  var parsed = parse(message, channelID);
  if (!parsed) {
    //console.log("Not a command");
    return;
  }
  var nsfwEnabled = false;
  if((parsed.isPM || database.nsfwChannels.indexOf(channelID) > -1) && config.content.allowNSFW){
    nsfwEnabled = true;
  }
  command.tryExec({
    "user": user,
    "userID": userID,
    "channelID": channelID,
    "rawEvent": rawEvent,
    "bot": bot,
    "db": database,
    "config": config, //,
    "logger": logger,
    "printError": printError,
    "logCommand": logCommand,
    "recursiveSplitMessages": recursiveSplitMessages,
    "nsfwEnabled": nsfwEnabled
  }, parsed.command, parsed.args);
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
        message: "```javascript\n" + eval(parsed.args.join(" ")) + "```"
      });
    } catch (e) {
      bot.sendMessage({
        to: channelID,
        message: "Something went wrong! \n\n```" + e.message + "```"
      });
    }
    return;
  }

  executeCommand(parsed.command, userID, channelID, function (err, res) {
    if (err) {
      logger.debug(err.error);
      logCommand(channelID, user, parsed.command, parsed.arguments, err.error);
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

      if (!parsed.args[0]) parsed.args[0] = "" //ech, ugly fix for .toLowerCase breaking
      logger.error(`>>> Line 758, UGLY FIX STILL IN PLACE. FIXFIXFIXFIX`)
      var nsfwEnabled = false;
      if((parsed.isPM || database.nsfwChannels.indexOf(channelID) > -1) && config.content.allowNSFW){
        nsfwEnabled = true;
      }
      commands[parsed.command].action(parsed.args, {
        "user": user,
        "userID": userID,
        "channelID": channelID,
        "rawEvent": rawEvent,
        "bot": bot,
        "db": database,
        "config": config, //,
        "logger": logger,
        "printError": printError,
        "logCommand": logCommand,
        "recursiveSplitMessages": recursiveSplitMessages,
        "nsfwEnabled": nsfwEnabled
      });
      commands[parsed.command].lastTime = (new Date()).getTime();
      logCommand(channelID, user, parsed.command, parsed.args);
    } else {
      if (database.messages[parsed.command]) {
        bot.sendMessage({
          to: channelID,
          message: database.messages[parsed.command]
        });
        return;
      }
    }
  });
}

function parse(string, channelID) {
  var pieces = string.split(" ");
  pieces = pieces.filter(Boolean); // removes ""

  if (pieces[0] === undefined) return null;
  var isPM = bot.serverFromChannel(channelID) == undefined ? true : false;
  if (!(uidFromMention.test(pieces[0]) && uidFromMention.exec(pieces[0])[1] === bot.id) && pieces[0].toLowerCase() != config.listenTo && !isPM) {
    return false
  }
  if(isPM == true && pieces[0].toLowerCase() != config.listenTo){
    pieces.unshift(" ");
  }
  if (pieces[1] === undefined) return null;
  if (pieces[1] === "\u2764") pieces[1] = "love"; //ech, used for love command because the receives a heart shaped character

  return {
    command: pieces[1].toLowerCase(),
    args: pieces.slice(2, pieces.length),
    isPM: isPM
  };
}


function executeCommand(command, uid, channelID, callback) {
  var banChecker = require("./modules/module_banning.js").isBanned;
  //var delayStart = new Date().getTime();

  banChecker(uid, function (result) {
    /*  var delay = Math.round((new Date()).getTime() - delayStart);
      bot.sendMessage({
        to: channelID,
        message: "Delay caused by SQL is: " + delay
      });*/
    if (result) {
      bot.sendMessage({
        to: uid,
        message: "<@" + uid + "> You are banned from using this bot. STOP TOUCHING ME.\nIf you want to know the ban reason or get unbanned, please message <@"+ config.general.masterID + ">"
      });
      return (callback && callback({ error: "User can't run the previous command because he is banned." }, false));
    }


    if (!commands[command]) {
      if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
        return (callback && callback({ error: "User can't run the previous command because I am not listening in this channel." }, false));
      }
      if (database.messages[command]) {
        return (callback && callback(null, true));
      }
      if (database.images[command]) {
        return (callback && callback(null, true));
      }
      return (callback && callback({ error: "User can't run the previous command because I don't know it." }, false));
    }


    if (!commands[command].permission) {

      if (database.channels.indexOf(channelID) != -1) {
        return (callback && callback(null, true));
      } else {
        return (callback && callback({ error: "User can't run the previous command because I am not listening in this channel." }, false));
      }
    }

    if (commands[command].permission.onlyMonitored) {
      if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
        return (callback && callback({ error: "User can't run the previous command because this command can be used only in channels what I monitor" }, false));
      }
    }

    if (!commands[command].permission.uid && !commands[command].permission.group) {
      return (callback && callback(null, true));
    }

    if (commands[command].permission.uid) {
      for (var i = 0; i < commands[command].permission.uid.length; i++) {
        if (uid == commands[command].permission.uid[i]) {
          return (callback && callback(null, true));
        }
      }
    }

    if (commands[command].permission.group) {
      for (var i = 0; i < commands[command].permission.group.length; i++) {
        if (database.isUserInGroup(uid, commands[command].permission.group[i])) {
          return (callback && callback(null, true));
        }
      }
    }
    return (callback && callback({ error: "User can't run the command because it has no permission or idk" }, false));
  });
}

function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */ dt;
}

function getUptimeString() {
  var t = Math.floor((((new Date()).getTime() / 1000) - startTime)) * 1000;
  var uptime = "";
  var d, h, m, s;
  s = Math.floor(t / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  d != 0 ? uptime += d + " days " : null;
  h != 0 ? uptime += h + " hours " : null;
  m != 0 ? uptime += m + " minutes " : null;
  s != 0 ? uptime += s + " seconds " : null;
  logger.debug({
    t: t,
    d: d,
    h: h,
    m: m,
    s: s
  });
  return uptime;
}

function convertMS(ms) {
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return {
    d: d,
    h: h,
    m: m,
    s: s
  };
}


//THIS FUNCTION WORKS SOMEHOW AS IS, NEVER TOUCH IT AGAIN OR IT MAY BREAK AND THE EVIL MAY BE SUMMONED
/*
 * Recursively goes over a long message and split's in in several messages with len < 2000
 *
 * @input e - the e OBJECT
 * @input msg - the message to be split up and sent
 * @input channelID - the channel where the message has to be sent
 * @input counter - splice counter, don't set this manually except if you know what you're doing
 * @lastLength - the lastLength of the message sent previously
 */

function recursiveSplitMessages(e, channelID, msg, counter, lastLength) {
  counter = counter || 1;
  var maxUncalculatedLength = 1900;
  var total = Math.ceil(msg.length / maxUncalculatedLength);
  var aditionalLenght = 0;
  while (msg[((lastLength || 0) + maxUncalculatedLength) + aditionalLenght] != "\n" && (maxUncalculatedLength + aditionalLenght) < 1990) {
    aditionalLenght++;
  }
  var currentSplice = msg.substring((lastLength || 0), parseInt((lastLength || 0) + (maxUncalculatedLength + aditionalLenght)));
  e.bot.sendMessage({
    to: channelID,
    message: currentSplice
  }, function (err, resp) {
    if (counter < total) {
      recursiveSplitMessages(e, channelID, msg, counter + 1, parseInt((maxUncalculatedLength + aditionalLenght)) + parseInt((lastLength || 0)));
    }
  });
}

function logCommand(channelID, user, cmd, arguments, error) {
  if (error == "User can't run the previous command because he is banned.") {
    bot.sendMessage({
      to: config.general.logChannel,
      message: "*" + Date() + "*\n**" + user + "** is a banned user and it's trying to touch me.\n\n"
    });
    return;
  }
  if (config.general.logging) {
    if (error) {
      bot.sendMessage({
        to: config.general.logChannel,
        message: "*" + Date() + "*\n**" + user + "\'s** access to the command `" + cmd + "` with the arguments `" + JSON.stringify(arguments) + "` in channel <#" + channelID + "> **has been denied**\n**Reason**: `" + error + "`\n\n"
      });
    } else {
      bot.sendMessage({
        to: config.general.logChannel,
        message: "*" + Date() + "*\n**" + user + "** used command `" + cmd + "` with the arguments `" + JSON.stringify(arguments) + "` in channel <#" + channelID + ">\n\n"
      });
    }
  }
}

function printError(channelID, err) {
  bot.sendMessage({
    to: channelID,
    message: "**Exception:** ```javascript\n" + JSON.stringify(err, null, '\t') + "```"
  });

}
