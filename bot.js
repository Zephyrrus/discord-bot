var startTimeMs = new Date();
var internalStartTime = new Date();
/*Variable area*/
const VERSION = require("./package.json").version;
const BRANCH = "Refactoring branch";
var MODE = "production";
var Discordbot = require('discord.io');
var fs = require('fs');
var http = require('http');
var logger = require("winston");
var os = require("os");
var MessageObject = require("./core/MessageObject.js");
var LiteBotWrapper = require("./core/DiscordBotLite.js");
var _bot;
var loaded = false;
var language = require('./configs/language.json');
var lock = true;

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
    token: auth.discord.token,
    autorun: true
});
var startTime = Math.round(new Date() / 1000);

var uidFromMention = /<@([0-9]+)>/;

var database = new(require("./database.js"))();
var away = [];

////
//var webConnecter = require("./modules/web/webModule.js");
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
	
    /*if (!fs.existsSync("./modules/cache")) {
        fs.mkdirSync("./modules/cache");
    }*/
    ////
    if (MODE == "development") {
        logger.info("Sending log in information to discord.");
        bot.editUserInfo({
            username: config.general.username //Optional
        }); 
    }
    logger.info("Connected!");
    logger.info("Logged in as: ");
    logger.info(bot.username + " - (" + bot.id + ")");
    logger.info("Listento: " + config.general.listenTo);
    logger.info("Version: " + VERSION + " ~ " + BRANCH);

    ////
    bot.setPresence({
        idle_since: null,
		type: 1,
		url: config.general.url,
        game: config.general.defaultStatus
    });
    logger.info("Set status!");

    ////
    _bot = new LiteBotWrapper(bot, config, database, startTimeMs);
    _bot.cm.load();
    var startupTime = Math.round((new Date()).getTime() - internalStartTime);
    logger.info(`It took ${internalStartTime} ms to initialize the bot.`);
    _bot.logJournal(`At {time} on {date}, I sucessfully ${lock ? "started up.":"restarted after disconnect from discord API."}\nCalculated start up time is **${startupTime}** ms.\nHostname **${os.hostname()}**\nVersion: **${VERSION}**`);
    lock = false;
});


bot.on('guildMemberAdd', doWelcome);

bot.on('message', processMessage);

bot.on("presence", function (user, userID, status, rawEvent) {
    /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function (rawEvent) {
    //var black = ["TYPING_START", "MESSAGE_CREATE", "PRESENCE_UPDATE", "USER_UPDATE"];
    //if(black.indexOf(rawEvent.t) < 0) console.log(rawEvent) //Logs every event
});

bot.on("disconnected", function () {
    logger.error("Bot disconnected");
    internalStartTime = new Date();
    bot.connect(); //Auto reconnect
});

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
    if(lock) return;
    var serverID = bot.serverFromChannel(channelID);
    if (userID == bot.id) {
        return;
    }
    if (serverID == undefined) {
        logger.verbose("PRIVATE MESSAGE: [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, ''));
        
    } else {
        logger.verbose("MESSAGE: (" + bot.fixMessage("<#" + channelID + ">") + ") [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, '') + (rawEvent.d.attachments[0] !== undefined ? "[attachments: " + rawEvent.d.attachments[0].url + " ]" : ""));
    }

    /*if (parsed.command == "eval") {
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
    }*/

    //banChecker(userID, function (result) {
        /*if (result) {
            bot.sendMessage({
                to: uid,
                message: "<@" + uid + "> You are banned from using this bot. STOP TOUCHING ME.\nIf you want to know the ban reason or get unbanned, please message <@" + config.general.masterID + ">"
            });
            return;
        }*/ // we cant send a message every time cause this will lead to a lot of spam cuase of the new parsers.
        // new module loader/executer

        var e = new MessageObject(
            _bot, {}, serverID, user, userID, channelID, message, rawEvent,
                { database: database, config: config,language: language }, // configs
                { logger: logger }, // functions
                { nsfwEnabled: null, isPM: null } // flags
            );
        _bot.cm.tryExec(e, function (err) {
            if (err && err.errorcode == 1) bot.sendMessage({
                to: channelID,
                message: "<@" + userID + "> you are doing that too fast!"
            });

            else if (err && err.errorcode == 2)
              e.mention().respond("Sorry, I can't run the command with the provided arguments.\n**" + err.error.usage + "**\nError: **" + err.error.message + "**");
            else if (err && err.errorcode != 404)
            	e._disco.logJournal(`<@132166948359241728>\nAt {time} on {date}, user **${e.user}** with id \`${e.userID}\` in channel **${e.channelID}** sent me **${e.message}**\nSomething went wrong \`\`\`javascript\n${JSON.stringify(err, null, '\t').replace(/([^\\])\\n/g, '$1\n\t')}\`\`\`\n`, "error", "180820908187844608");

            if (!err) return;
        });
    //});
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
    d !== 0 ? uptime += d + " days " : null;
    h !== 0 ? uptime += h + " hours " : null;
    m !== 0 ? uptime += m + " minutes " : null;
    s !== 0 ? uptime += s + " seconds " : null;
    /*logger.debug({
        t: t,
        d: d,
        h: h,
        m: m,
        s: s
    });*/
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

function doWelcome(userID, rawEvent) {
    logger.error(JSON.stringify(rawEvent));
    if (rawEvent.d.guild_id == '161871321670746112') {
        if(!rawEvent.d.user.bot){
            bot.addToRole({
                server: rawEvent.d.guild_id,
                user: rawEvent.d.user.id,
                role: '161897607650607104'
            }, function(err,res){
                bot.sendMessage({
                    to: '161871321670746112',
                    message: `**EXPLOSION!~**\n\nWelcome <@${rawEvent.d.user.id}> to the server. You have been assigned *member* rank by me.\nHave fun and please enjoy your stay.`
                });
            });
        }else{
            bot.addToRole({
                server: rawEvent.d.guild_id,
                user: rawEvent.d.user.id,
                role: '161874966470590466'
            }, function(err,res){
                bot.sendMessage({
                    to: '161871321670746112',
                    message: `**EXPLOSION!~**\n\nWelcome <@${rawEvent.d.user.id}> to the server. You have been assigned *bot* rank by me.\nHave fun and please enjoy your stay.`
                });
            });

        }
    }
}
