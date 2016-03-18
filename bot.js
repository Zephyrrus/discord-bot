var startTimeMs = new Date();
/*Variable area*/
const VERSION = require("./package.json").version;
const BRANCH = "Refactoring branch";
var MODE = "production";
var Discordbot = require('discord.io');
var fs = require('fs');
var http = require('http');
var logger = require("winston");
var MessageObject = require("./core/MessageObject.js");
var LiteBotWrapper = require("./core/DiscordBotLite.js");
var _bot;
var loaded = false;

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

var dt = new Date();
var t = (dt.getDate() + "_" + (dt.getMonth() + 1) + "_" + dt.getFullYear());
var fname = './log/' + t + '.log';
try {
    fs.mkdirSync('./log');
} catch (e) {

}

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true });
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
    if (!fs.existsSync("./modules/cache")) {
        fs.mkdirSync("./modules/cache");
    }
    if (MODE == "development") {
        logger.info("Sending log in information to discord.");
        bot.editUserInfo({
            password: auth.discord.password, //Required
            username: config.general.username //Optional
        });
        //commands['waifu'] = require("./modules/waifu/module_waifu.js");
    }
    logger.info("Connected!");
    logger.info("Logged in as: ");
    logger.info(bot.username + " - (" + bot.id + ")");
    logger.info("Listento: " + config.general.listenTo);
    bot.setPresence({
        idle_since: null,
        game: config.general.defaultStatus
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
            "cooldown": config.general.globalcooldown,
            "nsfwFilter": config.content.allowNSFW
        }
    }, bot);
    _bot = new LiteBotWrapper(bot);
    //load(_bot);
    _bot.cm.load();
    var startupTime = Math.round((new Date()).getTime() - startTimeMs);
    logger.info(`It took ${startupTime} ms to initialize the bot.`)
});



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


var banChecker = require("./modules/module_banning.js").isBanned;

function processMessage(user, userID, channelID, message, rawEvent) {
    var serverID = bot.serverFromChannel(channelID);
    if (userID == bot.id) {
        return;
    }
    if (serverID == undefined) {
        logger.verbose("PRIVATE MESSAGE: [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, ''));
        if (message.indexOf("discordapp.com") > -1 || message.indexOf("https://discord.gg/") > -1) {
            var invite = message.split("/").pop();
            if (invite.length > 5)
                bot.acceptInvite(invite, function (err, res) {
                    if (err) {
                        bot.sendMessage({
                            to: channelID,
                            message: "Can't join that server. \n```javascript\n" + JSON.stringify(err, null, "\t") + "```"
                        })
                        return;
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: "Joined server **" + res.guild.name + "**"
                    });
                    return;
                });
        }
    } else {
        logger.verbose("MESSAGE: (" + bot.fixMessage("<#" + channelID + ">") + ") [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, '') + (rawEvent.d.attachments[0] !== undefined ? "[attachments: " + rawEvent.d.attachments[0].url + " ]" : ""));
    }

    // new shit is here

    var parsed = parse(message, channelID);
    if (!parsed) {
        //console.log("Not a command");
        return;
    }
    var nsfwEnabled = false;
    if ((parsed.isPM || database.nsfwChannels.indexOf(channelID) > -1) && config.content.allowNSFW) {
        nsfwEnabled = true;
    }
    if (parsed.command == "eval") {
        if (userID != config.general.masterID) {
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
                message: "Something went wrong! \n\n```javascript\n" + e.stack + "```"
            });
        }
        return;
    }
    banChecker(userID, function (result) {
        if (result) {
            bot.sendMessage({
                to: uid,
                message: "<@" + uid + "> You are banned from using this bot. STOP TOUCHING ME.\nIf you want to know the ban reason or get unbanned, please message <@" + config.general.masterID + ">"
            });
            return;
        }
        // new module loader/executer
        var e = new MessageObject(_bot, {}, serverID, user, userID, channelID, message, rawEvent, { database: database, nsfwEnabled: nsfwEnabled, logger: logger, config: config });
        _bot.cm.tryExec(e, parsed.command, parsed.args, function (err) {
            if (err && err.errorcode == 1) bot.sendMessage({
                to: channelID,
                message: "<@" + userID + "> you are doing that too fast!"
            });
            else if (err && err.errorcode != 404)
                e.respond("```javascript\n" + JSON.stringify(err, null, '\t') + "```");
            else if (err && err.errorcode == 404) {
                if (database.messages[parsed.command]) {
                    e.respond(database.messages[parsed.command]);
                    return;
                }
            }
            if (!err) return;
        });
    });
}

function parse(string, channelID) {
    var pieces = string.split(" ");
    pieces = pieces.filter(Boolean); // removes ""

    if (pieces[0] === undefined) return null;
    var isPM = bot.serverFromChannel(channelID) == undefined ? true : false;
    if (!(uidFromMention.test(pieces[0]) && uidFromMention.exec(pieces[0])[1] === bot.id) && config.general.listenTo.indexOf(pieces[0].toLowerCase()) == -1 && !isPM) {
        return false
    }
    if (isPM == true && config.general.listenTo.indexOf(pieces[0].toLowerCase()) == -1) {
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

    banChecker(uid, function (result) {
        if (result) {
            bot.sendMessage({
                to: uid,
                message: "<@" + uid + "> You are banned from using this bot. STOP TOUCHING ME.\nIf you want to know the ban reason or get unbanned, please message <@" + config.general.masterID + ">"
            });
            return (callback && callback({ error: "User can't run the previous command because he is banned." }, false));
        }


        if (!commands[command]) {
            /*if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
              return (callback && callback({ error: "User can't run the previous command because I am not listening in this channel." }, false));
            }*/
            if (database.messages[command]) {
                return (callback && callback(null, true));
            }
            if (database.images[command]) {
                return (callback && callback(null, true));
            }
            return (callback && callback({ error: "User can't run the previous command because I don't know it." }, false));
        }


        if (!commands[command].permission) {

            /*if (database.channels.indexOf(channelID) != -1) {
              return (callback && callback(null, true));
            } else {
              return (callback && callback({ error: "User can't run the previous command because I am not listening in this channel." }, false));
            }*/
            return (callback && callback(null, true));
        }

        if (commands[command].permission.onlyMonitored) {
            /*if (database.channels.indexOf(channelID) == -1 && bot.serverFromChannel(channelID) != undefined) {
              return (callback && callback({ error: "User can't run the previous command because this command can be used only in channels what I monitor" }, false));
            }*/
            return (callback && callback(null, true));
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

function getUptimeString(startTime) {
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
        if (err) logger.error("[RECURSIVE_SPLIT]_ERROR: " + err);
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



function _getFilesRecursive(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}
