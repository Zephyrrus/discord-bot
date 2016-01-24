/*Variable area*/
var VERSION = "1.3.6 ~ Main branch";
var MODE = "production";

process.argv.forEach(function(val, index, array) {
  if (val === "development") MODE = "development";
});

if (MODE === "production") {
  var config = require('./configs/config.json');
  var auth = require('./configs/auth.json'); // or remove ./ for absolute path ^_^
} else {
  var config = require('./configs/config_dev.json');
  var auth = require('./configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}

var Discordbot = require('discord.io');
var fs = require('fs');
var http = require('http');
var logger = require("winston");
GLOBAL.MODE = MODE;
var bot = new Discordbot({
  email: auth.discord.email,
  password: auth.discord.password,
  autorun: true
});
var startTime = Math.round(new Date() / 1000);
var personalRoom = 133337987520921600;
var uidFromMention = /<@([0-9]+)>/;

var database = new(require("./database.js"))();
var away = [];
config.deletereddit = config.deletereddit || false;
/*----------------------------------------------*/
/*Event area*/
bot.on("err", function(error) {
  logger.error(error)
});

bot.on("ready", function(rawEvent) {
  // console.log(config);
  //load loger
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
    colorize: true
  });
  logger.level = 'debug';
  //load bot
  if (MODE == "development") {
    bot.editUserInfo({
      password: auth.discord.password, //Required
      username: config.username //Optional
    });
    logger.add(logger.transports.File, {
      level: 'debug',
      filename: "log.txt"
    });
  }
  logger.info("Connected!");
  logger.info("Logged in as: ");
  logger.info(bot.username + " - (" + bot.id + ")");
  logger.info("Listento: " + config.listenTo);
  bot.setPresence({
    idle_since: null,
    game: config.defaultStatus
  });
  logger.info("Version: " + VERSION);
  logger.info("Set status!");
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
    action: function(args, e) {
      var delayStart = new Date().getTime();
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Pong"
      }, function(response) {
        var delay = Math.round((new Date()).getTime() - delayStart);
        bot.editMessage({
          channel: response.channel_id,
          messageID: response.id,
          message: "<@" + e.userID + "> Pong\nNetwork delay: **" + delay + "** ms"
        }, function(response) { //CB Optional
          //console.log(response);
        });
      });
      logger.debug("Ponged <@" + e.userID + ">");
    }
  },
  setstatus: {
    category: "management",
    permission: {
      uid: [config.masterID],
      onlyMonitored: true,
      group: ['dev', 'waifu'],
    },
    action: function(args, e) {
      e.bot.setPresence({
        idle_since: null,
        game: args.join(" ")
      });
    }
  },
  id: {
    category: "info",
    description: "id <myid/channel/server/@mention> - shows the id of the requested channel/user/etc ",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
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
          message: args[0] + "`" + args[0].substring(2, args[0].length - 1) + "`"
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
    action: function(args, e) {
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
    category: "entertainment",
    description: "emote <argument> - posts an emote",
    permission: {
      onlyMonitored: true
    },
    cooldown: config.globalcooldown,
    lastTime: 0,
    action: function(args, e) {
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
          file: fs.createReadStream(database.images[args[0].toLowerCase()])
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
    action: function(args, e) {
      //sendMessages(e, ["**Commands I know: **", "```reddit/subreddit <arguments> - posts a random image from /hot of that subreddit\n9gag - gets a random post from 9GAG\nkitten <me> -  you know what this does ^_^\nnightcore - selects a random nightcore from the database\nnightcore add <youtubeid> - add a new nightcore to the database (please don't troll, no checks in place for now, but every add is logged and who abuses it will be banned from rin)\nnightcore count - counts how many nightcores are in the database right now\nnightcore list - lists the id of every nightcore from the database\nid - returns the id of the channel\njson - returns a formated json of your message\nbat - how to run a bat file if you don't know\nemote <argument> - posts an emote\nhelp - shows this silly\nI know a lot more commands but my developer is a lazyass and didn't add them there yet.```"]);
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
        if (commands[cmd])
          if (commands[cmd].permission.group != undefined) {
            if (commands[cmd].permission.group.indexOf(userInGroups[0]) > -1) {
              if (commands[cmd].permission.uid == undefined) {
                pushCommand(queryResult, cmd);
              }
            }
          } else {
            pushCommand(queryResult, cmd);
          } else logger.error("Unknown error when registering the following command: " + cmd);
      }

      /* SORTING */
      /* NO SORTING BECAUSE JS */

      /* HELP MESSAGE GENERATING */
      //queryResult = queryResult.sort();
      var helpMessage = "All commands are prefixed with `" + config.listenTo + "`\n**Allowed commands: **\n```\n";
      for (var category in queryResult) {
        helpMessage += category.toString() + "\n";
        for (var command in queryResult[category]) {
          if (commands[queryResult[category][command]].description != undefined) {
            if (commands[queryResult[category][command]].description instanceof Array) {
              for (var i = 0; i < commands[queryResult[category][command]].description.length; i++) {
                helpMessage += "\t" + commands[queryResult[category][command]].description[i] + "\n"
              }
            }else{
              helpMessage += "\t" + commands[queryResult[category][command]].description + "\n"
            }
          } else {
            if(queryResult[command] == undefined){
              logger.error(command + " - " + queryResult[command] + " - " + category);
            }
            helpMessage += "\t" + queryResult[command] + " - No description\n"
          }
        }
        helpMessage += "\n";
      }

      if(e.bot.serverFromChannel(e.channelID) != undefined) e.bot.sendMessage({
        to: e.channelID,
        message: "Please check your private messages for the commands."
      })
      e.bot.sendMessage({
        to: e.userID,
        message: helpMessage + "```\nThere might be some more commands. Either I forgot to add them to this list, or they require certain permissions."
      });
    }


  },
  come: {
    category: "management",
    description: "come - starts listening to the current channel and will answer commands",
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
    action: function(args, e) {
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
    action: function(args, e) {
      sendMessages(e, ["```" + JSON.stringify(e.rawEvent, null, '\t').replace(/`/g, '\u200B`') + "```"]);
    }
  },
  love: {
    category: "misc",
    permission: {
      uid: [config.masterID],
      group: ["waifu"],
      onlyMonitored: true
    },
    action: function(args, e) {
      sendMessages(e, ["<@" + e.userID + "> \u2764 I love you"]);
    }
  },
  waifu: {
    category: "misc",
    description: "waifu - who is the bot's waifu",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
      sendMessages(e, ["My waifu is Benolot \u2764"]);
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
    action: function(args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      if (args[0].toLowerCase() == "zombie") {
        sendMessages(e, ["My status is:\nMy current version is: **" + VERSION + "**\nI been awake since **" + tm(startTime) + "**\nI am in **" + MODE + "** mode right now.\nMy current uptime in seconds is: **" + t + "** seconds\nThe global cooldown is set to **" + config.globalcooldown / 1000 + "** seconds\nZephy is the best developer and I am the best catgirl \u2764\n*whispers* Reddit adult mode filtering is right now set to: **" + !config.allowNSFW + "** (no NSFW if this is true)\nListen to my theme song please https://www.youtube.com/watch?v=neQY2fXqBLM :3"]);
        return;
      }
      sendMessages(e, ["My status is:\nMy current version is: **" + VERSION + "**\nI been awake since **" + tm(startTime) + "**\nI am in **" + MODE + "** mode right now.\nMy current uptime is: **" + t + "** seconds\nThe global cooldown is set to **" + config.globalcooldown / 1000 + "** seconds\nZephy is the best developer and I am the best catgirl \u2764\n*whispers* Reddit adult mode filtering is right now set to: **" + !config.allowNSFW + "** (no NSFW if this is true)\nListen to my theme song please https://www.youtube.com/watch?v=zwZ89IZG5WA :3"]);
    }
  },
  uptime: {
    category: "info",
    description: "uptimes - shows the bot's current uptime",
    permission: {
      onlyMonitored: true
    },
    action: function(args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      e.bot.sendMessage({
        to: e.channelID,
        message: "I been awake since **" + tm(startTime) + "**\nI am in **" + MODE + "** mode right now.\nMy current uptime is: **" + t + "** seconds"
      });
    }
  },
  //modules
  dance: require('./modules/module_personality.js').dance,
  group: require("./modules/module_group.js"),
  greet: require("./modules/module_greetings.js"),
  message: require("./modules/module_message.js"),
  nightcore: require("./modules/module_nightcore.js"),
  '9gag': require("./modules/module_9gag.js"),
  kitten: require("./modules/module_kitten.js"),
  anime: require("./modules/module_animedb.js"),
  reddit: require("./modules/module_reddit.js"),
  osu: require("./modules/module_osu.js"),
  encode: require("./modules/module_hashing.js").encode,
  decode: require("./modules/module_hashing.js").decode,
  admin: require("./modules/module_banning.js").ban,
  flip: require("./modules/module_flip.js"),
  reminder: require("./modules/module_reminder.js"),
}

bot.on('message', processMessage);

bot.on("presence", function(user, userID, status, rawEvent) {
  /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function(rawEvent) {
  //console.log(rawEvent) //Logs every event
});

bot.on("disconnected", function() {
  logger.error("Bot disconnected");
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
  //logger.debug("-----------");
  logger.debug("Got message: '" + message.replace(/[^A-Za-z0-9 ]/g, '?') + "' on channel '" + channelID.replace(/[^A-Za-z0-9 ]/g, '?') + "' from '" + user + "' (" + userID.replace(/[^A-Za-z0-9 ]/g, '?') + ")");

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
        message: "```" + eval(parsed.args.join(" ")) + "```"
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
    logger.info("User " + userID + " cant run this command");
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
    commands[parsed.command].action(parsed.args, {
      "user": user,
      "userID": userID,
      "channelID": channelID,
      "rawEvent": rawEvent,
      "bot": bot,
      "db": database,
      "config": config, //,
      "logger": logger
        //"auth": auth
    });
    commands[parsed.command].lastTime = (new Date()).getTime();
  } else {
    if (database.messages[parsed.command]) {
      bot.sendMessage({
        to: channelID,
        message: database.messages[parsed.command]
      });
      return;
    }
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
  if (database.bans[uid]) {
    bot.sendMessage({
      to: uid,
      message: "<@" + uid + "> You are banned from using this bot. STOP TOUCHING ME.\nIf you want to know the ban reason or get unbanned, please message Zephy"
    });

    return false;
  }
  if (!commands[command]) {
    if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
      logger.info("User can't run the previous command because I am not listening in this channel.");
      return false;
    }
    if (database.messages[command]) {
      return true;
    }
    if (database.images[command]) {
      return true;
    }
    logger.info("User can't run the previous command because I don't know it");
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
    if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
      logger.info("User can't run the previous command because this command can be used only in channels what I monitor");
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

function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */ dt;
}
