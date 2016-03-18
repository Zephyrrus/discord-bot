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
        description: ""
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
        params: [{ id: "userID", type: "mention", required: true }]
    },
    "log": {
        helpMessage: "log",
        category: "Info",
        handler: getMessages,
    }
}

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
    e.respond("- Author: <@" + e.config.general.masterID + "> [Zephy]\n\
- Version: " + e._disco._version + "\n\
- Library: Discord.io \n\
**Stats for current instance**\n\
- Uptime: " + utils.tm(e._disco._startTime / 1000) + " [ " + utils.getUptimeString(e._disco._startTime / 1000) + "]\n\
- Server time: " + now.toString() + "\n\
- Connected to: " + Object.keys(e._disco.bot.servers).length + " servers, " + channelCount + " channels, " + userCount + " users\n\
- Modules: " + Object.keys(e._disco.cm.modules).length + "\n\
- Commands: " + (Object.keys(e._disco.cm.commands).length + commandCount) + "\n\
- Channel NSFW filter: " + !e.allowNSFW + " (TRUE means no NSFW in this channel/server).")
}

function getRoles(e, args) {
    res = "";
    for (var role in e._disco.bot.servers[e.serverID].roles) {
        res += role + ":" + e._disco.bot.servers[e.serverID].roles[role].name + " [position: " + e._disco.bot.servers[e.serverID].roles[role].position + "]\n"
    }
    e.mention().respondLong("Roles on this server: \n```css\n" + res + "```");

}

function tryHelp(e, args) {
    e.respond("```javascript\n" + JSON.stringify(e._disco.cm.getHelpCommand(args.command), null, '\t') + "```");
}

function doHelp(e, args) {
    var help = e._disco.cm.getHelpCommand(args.command);
    if (typeof help === "object") {
        var str = "";
        str += `**Category**: ${help.category}**\nModuleID**: ${help.moduleID}\n`
        if (help.parent.command) str += `\n${help.parent.command} ${help.parent.arguments} - **${help.parent.help}**`
        if (help.child.length > 0) {
            for (var i = 0; i < help.child.length; i++)
                str += `\n\t${help.parent.command} ${help.child[i].command} ${help.child[i].arguments} - **${help.child[i].help}**`
        }
        e.pmRespondLong(str);
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
    var str = "All commands are prefixed with `" + e.config.general.listenTo + "` or mention of the bot.\n**Commands to which you have access:** \n";
    for (var cmd in e._disco.cm.commands) {
        var help = e._disco.cm.getHelpPermission(cmd, e.userID, e.serverID);
        if (typeof help === "object") {
            if (help.parent.command) str += `\n${help.parent.command} ${help.parent.arguments} - **${help.parent.help}**`
            if (help.child && help.child.length > 0) {
                for (var i = 0; i < help.child.length; i++)
                    str += `\n\t${help.parent.command} ${help.child[i].command} ${help.child[i].arguments} - **${help.child[i].help}**`
            }
            str += "\n";
        }
        //console.log(cmd);
    }
    e.pmRespondLong(str);
    e.mention().respond("Please check your private messages. **EXPLOSION**");
}

function dumpJson(e, args) {
    e.code(JSON.stringify(e.rawEvent, null, '\t').replace(/`/g, '\u200B`'), "javascript").respond();
}

function doWhois(e, args) {
    var mentionedUser = e._disco.bot.servers[e.serverID].members[args.userID];
    if (!mentionedUser) {
        e.mention().respond("I have no information about that user.");
        return;
    }
    str = "USER-INFO: \n";
    str += `\tName: ${mentionedUser.user.username}\n`;
    str += `\tID: ${mentionedUser.user.id}\n`;
    str += `\tDiscriminator: ${mentionedUser.user.discriminator}\n`;
    str += `\tAvatar URL: https://cdn.discordapp.com/avatars/${mentionedUser.user.id}/${mentionedUser.user.avatar}.jpg\n`;
    str += "\nSERVER-INFO: \n"
    str += `\tJoined at: ${new Date(Date.parse(mentionedUser.joined_at))}\n`;
    str += `\tCurrent status: ${mentionedUser.status ? mentionedUser.status: "Offline"}\n`;
    if (mentionedUser.game != null) str += `\tPlaying: ${mentionedUser.game.name}\n`;
    str += `\tRoles: `;
    for (var i = 0; i < mentionedUser.roles.length; i++) {
        if (e._disco.bot.servers[e.serverID].roles[mentionedUser.roles[i]].name == "@everyone") {
            str += "[at]everyone";
        } else {
            str += e._disco.bot.servers[e.serverID].roles[mentionedUser.roles[i]].name;
        }
        if (i + 1 != mentionedUser.roles.length) str += ", ";
    }
    str += "\n\n";
    str += `VOICE-INFO:\n\tMuted:${mentionedUser.mute}\n\tDeafen:${mentionedUser.deaf}`
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

    function _getMessage(channelID, limit, currentSlice, before, maximumSlices) {
        currentSlice = currentSlice || 0;
        var o = { channel: e.channelID, before: before, limit: 100 };
        e._disco.bot.getMessages(o, function (error, messageArr) {
            if (error && error.statusCode) return console.log(error);
            if (error && !error.statusCode) _getMessage(channelID, limit, currentSlice, before, maximumSlices);

            for (var i = 0; i < messageArr.length; i++) {
                database.insert({ channelID: messageArr[i].channel_id, name: messageArr[i].author.username, content: messageArr[i].content, userID: messageArr[i].author.id, timestamp: (new Date(Date.parse(messageArr[i].timestamp)) | 0) }, function (err) {
                    if (err) return;
                });
            }
            if (maximumSlices == currentSlice) return;
            if (messageArr.length > 0) {
                _getMessage(channelID, limit, currentSlice++, messageArr[messageArr.length - 1].id, maximumSlices);
            }

        });
    }

    e.respond(`Dumping \`${e.channelID}\``);
    _getMessage(e.channelID, 100);
}
