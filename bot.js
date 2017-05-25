var startTimeMs = new Date();
var internalStartTime = new Date();
//process.uptime()
/*Variable area*/
const VERSION = require("./package.json").version;
const BRANCH = "New_Year_Branch";
var MODE = "production";
var Discord = require('discord.io');
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

var retryCount = 0;

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

GLOBAL.MODE = MODE;

const bot = new Discord.Client({
    token: auth.discord.token,
    autorun: true
});
var startTime = Math.round(new Date() / 1000);

var uidFromMention = /<@([0-9]+)>/;

var database = new(require("./database.js"))();
var away = [];

Discord.Client.prototype.serverFromChannel = function(channelID) {
    return (this.channels[channelID] ? this.channels[channelID].guild_id : false);
};

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
logger.add(logger.transports.Console, {
    colorize: true,
    handleExceptions: true,
    humanReadableUnhandledException: true
});
logger.add(logger.transports.File, {
    level: 'debug',
    filename: fname
});
logger.level = 'debug';
/*----------------------------------------------*/
/*Event area*/
bot.on("err", function(error) {
    logger.error(error);
});

bot.on("ready", function(rawEvent) {
    retryCount = 0;
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

bot.on("presence", function(user, userID, status, rawEvent) {
    /*console.log(user + " is now: " + status);*/
});

bot.on("debug", function(rawEvent) {
    //var black = ["TYPING_START", "MESSAGE_CREATE", "PRESENCE_UPDATE", "USER_UPDATE"];
    //if(black.indexOf(rawEvent.t) < 0) console.log(rawEvent) //Logs every event
});

bot.on("disconnect", function(errMsg, code) {
    logger.error("Bot disconnected");
    logger.error(errMsg);
    logger.error(code);
    internalStartTime = new Date();
    bot.connect(); //Auto reconnect
});


function processMessage(user, userID, channelID, message, rawEvent) {
    if (lock) {
        logger.verbose("Received message but event handler is locked!");
        return;
    }

    var serverID = bot.serverFromChannel(channelID);
    if (userID == bot.id) {
        return;
    }
    if (serverID == undefined) {
        logger.verbose("PRIVATE MESSAGE: [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, ''));
    } else {
        logger.verbose("MESSAGE: (" + bot.fixMessage("<#" + channelID + ">") + ") [" + user + "]: " + message.replace(/[^A-Za-z0-9.,\/#!$%\^&\*;:{}=\-_`~() ]/, '') + (rawEvent.d.attachments[0] !== undefined ? "[attachments: " + rawEvent.d.attachments[0].url + " ]" : ""));
    }

    // new module loader/executer

    var e = new MessageObject(
        _bot, {}, serverID, user, userID, channelID, message, rawEvent, {
            database: database,
            config: config,
            language: language
        }, // configs
        {
            logger: logger
        }, // functions
        {
            nsfwEnabled: null,
            isPM: null
        } // flags
    );
    _bot.cm.tryExec(e, function(err) {
        if (err && err.errorcode == 1) bot.sendMessage({
            to: channelID,
            message: "<@" + userID + "> you are doing that too fast!"
        });

        else if (err && err.errorcode == 2)
            e.mention().embed({
                "type": "rich",
                "fields": [{
                    "name": "Usage",
                    "value": err.error.usage,
                }, {
                    "name": "Error",
                    "value": err.error.message,
                }],
                "color": 16711680,
            }, "**Sorry, I can't run the command with the provided arguments.\n**").respond();
        else if (err && err.errorcode != 404)
            e._disco.logJournal(`<@132166948359241728>\nAt {time} on {date}, user **${e.user}** with id \`${e.userID}\` in channel **${e.channelID}** sent me **${e.message}**\nSomething went wrong \`\`\`javascript\n${JSON.stringify(err, null, '\t').replace(/([^\\])\\n/g, '$1\n\t')}\`\`\`\n`, "error", "180820908187844608");

        if (!err) return;
    });
    //});
}

function doWelcome(userID, rawEvent) {
    logger.error(JSON.stringify(rawEvent));
    if (rawEvent.d.guild_id == '161871321670746112') {
        if (!rawEvent.d.user.bot) {
            bot.addToRole({
                server: rawEvent.d.guild_id,
                user: rawEvent.d.user.id,
                role: '161897607650607104'
            }, function(err, res) {
                bot.sendMessage({
                    to: '161871321670746112',
                    message: `**EXPLOSION!~**\n\nWelcome <@${rawEvent.d.user.id}> to the server. You have been assigned *member* rank by me.\nHave fun and please enjoy your stay.`
                });
            });
        } else {
            bot.addToRole({
                server: rawEvent.d.guild_id,
                user: rawEvent.d.user.id,
                role: '161874966470590466'
            }, function(err, res) {
                bot.sendMessage({
                    to: '161871321670746112',
                    message: `**EXPLOSION!~**\n\nWelcome <@${rawEvent.d.user.id}> to the server. You have been assigned *bot* rank by me.\nHave fun and please enjoy your stay.`
                });
            });

        }
    }
}