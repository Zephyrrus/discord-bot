//var mcping = require("mc-ping-updated");
var utils = require("./common/utils.js")

/*function doPing(args, e) {
    var serverToQuery = args.join("");
    mcping('146.20.68.110', 25565, function (err, res) {
        if (err) {
            e.mention().respond("Something went wrong when checking for your minecraft server!\nThe error is below:\`\`\`\nServ: " + serverToQuery.split(":")[0] + "\nport: " + serverToQuery.split(":")[1] + "\n\n\n\n" + JSON.stringify(err, null, '\t').replace(/`/g, '\u200B`') + "\`\`\`");
        } else {
            e.mention().respond("**MOTD:** " + res.description.text.replace(/(§)([0-9]|[a-f])/g, "") + "\n" +
                "**Version:** " + res.version.name + "\n" +
                "**Players Online:** " + res.players.online + "/" + res.players.max + "\n")
            return;
        }
    }, 3000);
}*/

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Test module",
        version: "1.0.0",
        author: "Zephy",
        description: "",
        //setup: setup
    },
    "debug": {
        handler: tryHelp,
        permission: "debug",
        params: [{ id: "command", type: "string", required: true }],
        category: "debug",
        child: [
            { name: "roles", handler: getRoles, helpMessage: "gets the roles on the current server" },
            { name: "help", handler: doHelp, helpMessage: "gets help about current command", params: [{ id: "command", type: "string", required: true }] },
            { name: "json", handler: dumpJson, helpMessage: "shows a formated json of the response received from the server" }
        ]
    },
    "help": {
        category: "info",
        helpMessage: "shows help",
        handler: getPermissionHelp,
        cooldown: 10000
    },
    "status": {
        helpMessage: "returns the status of the bot",
        category: "info",
        handler: status,
    },
    "module": {
        helpMessage: "shows currently loaded modules",
        category: "debug",
        handler: getModules
    },
    "whois": {
        helpMessage: "gets information about a specific user.",
        category: "Info",
        handler: doWhois,
        params: [{ id: "userID", type: "mention", required: false, canError: true }]
    },
    "log": {
        helpMessage: "log",
        category: "Info",
        params: [{ id: "channelID", type: "string", required: false }],
        handler: getMessages,
    }
};

function status(e, args) {
    var t = Math.floor((((new Date()).getTime()) - (e._disco._startTime)));
    var channelCount = 0;
    var userCount = 0;
    var commandCount = 0;
    for (var server in e._disco.bot.servers) {
        channelCount += Object.keys(e._disco.bot.servers[server].channels).length;
        userCount += Object.keys(e._disco.bot.servers[server].members).length;
    }
    for (var cmd in e._disco.cm.commands) {
        if (e._disco.cm.commands[cmd].child) commandCount += Object.keys(e._disco.cm.commands[cmd].child).length;
    }
    var now = new Date();
    e.respond("- Author: <@" + e._disco.config.general.masterID + "> [Zephy]\n\
- Version: " + e._disco._version + "\n\
- Library: Discord.io \n\
- Source code: https://github.com/Zephyrrus/discord-bot/ \n\
**Stats for current instance**\n\
- Uptime: " + utils.tm(e._disco._startTime / 1000) + " [ " + utils.getUptimeString(e._disco._startTime / 1000) + "]\n\
- Server time: " + now.toString() + "\n\
- Connected to: " + Object.keys(e._disco.bot.servers).length + " servers, " + channelCount + " channels, " + userCount + " users\n\
- Modules: " + Object.keys(e._disco.cm.modules).length + "\n\
- Commands: " + (Object.keys(e._disco.cm.commands).length + commandCount) + "\n\
- Channel NSFW filter: " + !e.allowNSFW + " (TRUE means no NSFW in this channel/server).");
}

function getRoles(e, args) {
    res = "";
    for (var role in e._disco.bot.servers[e.serverID].roles) {
        res += role + ":" + e.clean(e._disco.bot.servers[e.serverID].roles[role].name) + " [position: " + e._disco.bot.servers[e.serverID].roles[role].position + "]\n";
    }
    e.mention().respond("Roles on this server: \n```css\n" + res + "```");

}

function tryHelp(e, args) {
    e.respond("```javascript\n" + JSON.stringify(e._disco.cm.getHelpCommand(args.command), null, '\t') + "```");
}

function doHelp(e, args) {
    var help = e._disco.cm.getHelpCommand(args.command);
    if (typeof help === "object") {
        var str = "";
        str += `**Category**: ${help.category}**\nModuleID**: ${help.moduleID}\n`;
        if (help.parent.command) str += `\n${help.parent.command} ${help.parent.arguments} - **${help.parent.help}**`;
        if (help.child.length > 0) {
            for (var i = 0; i < help.child.length; i++)
                str += `\n\t${help.parent.command} ${help.child[i].command} ${help.child[i].arguments} - **${help.child[i].help}**`;
        }
        e.pm(str);
        e.mention().respond("Please check your private messages. **EXPLOSION**");
    }
}


function getModules(e, args) {
    var str = "```\nCurrently loaded modules:\n";
    var plugins = Object.keys(e._disco.cm.modules);
    plugins.forEach(function (v) {
        var info = e._disco.cm.modules[v];
        str += `\t${info.moduleName} [${v}], v${info.version} ${info.author ? "(by " + info.author + ")" : ""} ${info.description}\n`;
    });
    str += "```";
    e.respond(str);
}


function getPermissionHelp(e, args) {
    var str = "All commands are prefixed with `" + e._disco.config.general.listenTo + "` or mention of the bot.\n**Commands to which you have access:** \n";
    for (var cmd in e._disco.cm.commands) {
        var help = e._disco.cm.getHelpPermission(cmd, e.userID, e.serverID);
        if (typeof help === "object") {
            if (help.parent.command) str += `\n${help.parent.command} ${help.parent.arguments} - **${help.parent.help}**`;
            if (help.child && help.child.length > 0) {
                for (var i = 0; i < help.child.length; i++)
                    str += `\n\t${help.parent.command} ${help.child[i].command} ${help.child[i].arguments} - **${help.child[i].help}**`;
            }
            str += "\n";
        }
        //console.log(cmd);
    }
    e.pm(str);
    e.mention().respond("Please check your private messages. **EXPLOSION**");
}

function dumpJson(e, args) {
    e.code(JSON.stringify(e.rawEvent, null, '\t').replace(/`/g, '\u200B`'), "javascript").respond();
}

function doWhois(e, args) {
    args.userID = args.userID;
    var mentionedUser;
    str = "USER-INFO: \n";
    if(e._disco.bot.servers[e.serverID]) {
        mentionedUser = e._disco.bot.servers[e.serverID].members[args.userID];
    }

    if(mentionedUser === undefined) {
            var stradd = "\n\tTHIS USER IS NOT FROM THIS SERVER\n\n";
            for (var sid in e._disco.bot.servers) {
                if (e._disco.bot.servers.hasOwnProperty(sid)) {
                    if(e._disco.bot.servers[sid].members[args.userID]) {
                        mentionedUser = e._disco.bot.servers[sid].members[args.userID];
                    }
                }
            }
    }
    if (!mentionedUser) {
        e.mention().respond("I have no information about that user.");
        return;
    }
    str = "USER-INFO: \n";
    str += stradd || "";
    str += `\tName: ${e.clean(mentionedUser.user.username)}\n`;
    str += `\tID: ${mentionedUser.user.id}\n`;
    str += `\tDiscriminator: ${mentionedUser.user.discriminator}\n`;
    str += `\tAvatar URL: https://cdn.discordapp.com/avatars/${mentionedUser.user.id}/${mentionedUser.user.avatar}.jpg\n`;
    str += "\nSERVER-INFO: \n";
    str += `\tJoined at: ${new Date(Date.parse(mentionedUser.joined_at))}\n`;
    str += `\tCurrent status: ${mentionedUser.status ? mentionedUser.status: "Offline"}\n`;
    if (mentionedUser.game) str += `\tPlaying: ${e.clean(mentionedUser.game.name)}`;
    /*str += `\tRoles: `;
    for (var i = 0; i < mentionedUser.roles.length; i++) {
      console.log(e._disco.bot.servers[e.serverID].roles);
        str += e.clean(e._disco.bot.servers[e.serverID].roles[mentionedUser.roles[i]].name);
        if (i + 1 != mentionedUser.roles.length) str += ", ";
    }*/
    str += "\n\n";
    str += `VOICE-INFO:\n\tMuted:${mentionedUser.mute}\n\tDeafen:${mentionedUser.deaf}`;
    e.code(str, "css").respond();
}

var databaseStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "channelID", type: "string", required: true },
    { name: "timestamp", type: "integer", required: true, unique: true },
    { name: "name", type: "string", required: true},
    { name: "userID", type: "string", required: true},
    { name: "content", type: "string", required: true },
];

var database = new(require("../core/Database/databaseHandler.js"))('logs', databaseStructure);

function getMessages(e, args) {
    args.channelID = args.channelID || e.channelID;

    function _getMessage(channelID, limit, currentSlice, before, maximumSlices, retries) {
        currentSlice = currentSlice || 0;
        retries = retries || 0;
        var o = { channel: e.channelID, before: before, limit: 100 };
        e._disco.bot.getMessages(o, function (error, messageArr) {
          if(error){
            if (error.statusCode) {return _getMessage(channelID, limit, currentSlice, before, maximumSlices, retries++);}
            if (!error.statusCode) {return _getMessage(channelID, limit, currentSlice, before, maximumSlices, retries++);}
            console.log(error);
          }

            if(retries > 5) return;

            if (!messageArr){ _getMessage(channelID, limit, currentSlice, before, maximumSlices, retries++); }
            for (var i = 0; i < messageArr.length; i++) {
                database.insert({ channelID: messageArr[i].channel_id, name: messageArr[i].author.username, content: messageArr[i].content, userID: messageArr[i].author.id, timestamp: Math.floor(new Date(Date.parse(messageArr[i].timestamp))) }, function (err) {
                    if (err) return;
                });
            }
            if (maximumSlices == currentSlice) return;
            if (messageArr.length > 0) {
                retries = 0;
                _getMessage(channelID, limit, currentSlice++, messageArr[messageArr.length - 1].id, maximumSlices, retries);
            }

        });
    }

    e.respond(`Dumping \`${args.channelID}\``);
    _getMessage(args.channelID, 100);
}
