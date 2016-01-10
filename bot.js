/*Variable area*/
var VERSION = "1.2.4 - Module branch";
var MODE = "production";
process.argv.forEach(function(val, index, array) {
  if (val === "development") MODE = "development";
});
if (MODE === "production") {
  var config = require('./configs/config.json');
  var auth = require('./configs/auth.json'); // or remove ./ for absolute path ^_^
}
else {
  var config = require('./configs/config_dev.json');
  var auth = require('./configs/auth_dev.json'); // or remove ./ for absolute path ^_^
}
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


var database = new(require("./database.js"))();
var away = [];
config.deletereddit = config.deletereddit || false;
/*----------------------------------------------*/
/*Event area*/
bot.on("err", function(error) {
  console.log(error)
});

bot.on("ready", function(rawEvent) {
  // console.log(config);
  /*bot.editUserInfo({
    password: auth.password, //Required
    username: config.username //Optional
  })*/
  console.log("Connected!");
  console.log("Logged in as: ");
  console.log(bot.username + " - (" + bot.id + ")");
  console.log("Listento: " + config.listenTo);
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
  reddit: require("./modules/module_reddit.js"),
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
  group: require("./modules/module_group.js"),
  //TODO load a database with multiple greetings, like how images are done but with an array of messages for every greeting
  greet: require("./modules/module_greetings.js"),
  message: require("./modules/module_message.js"),
  nightcore: require("./modules/module_nightcore.js"),
  info: {
    permission: {
      uid: [config.masterID],
      group: ["dev"],
      onlyMonitored: true
    },
    action: function(args, e) {
      var t = Math.floor((((new Date()).getTime() / 1000) - startTime));
      sendMessages(e, ["My status is:\nMy current version is: **" + VERSION + "**\nI been awake since **" + tm(startTime) + "**\nI am in **" + MODE + "** mode right now.\nMy current uptime in seconds is: **" + t + "** seconds\nZephy is the best developer \u2764\n*whispers* My nsfw mode is right now set to: **" + config.redditAdultMode + "**\nListen to my theme song please https://www.youtube.com/watch?v=Vw32WZJSMU4 :3"]);
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
      console.log("User can't run the previous command because I am not listening in this channel.");
      return false;
    }
    if (database.messages[command]) {
      return true;
    }
    if (database.images[command]) {
      return true;
    }
    console.log("User can't run the previous command because I don't know it");
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
      console.log("User can't run the previous command because I am not listening in this channel.");
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
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */dt;
}
