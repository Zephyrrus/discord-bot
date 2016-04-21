var databaseStructure = [{
    name: "id",
    type: "autonumber",
    primaryKey: true
}, {
    name: "name",
    type: "string",
    required: true,
    unique: true
}, {
    name: "message",
    type: "string",
    required: true
}, {
    name: "msgid",
    type: "number",
    required: true
}, {
    name: "multiple",
    type: "bool",
    required: true
}];
var database = new(require("../core/Database/databaseHandler.js"))('messages', databaseStructure);

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Message manager",
        version: "1.0.5",
        author: "Zephy",
        description: "Manages the messages to what the bot automatically responds.",
        end: predefinedMessage
    },
    "message": {
        helpMessage: "Messages",
        category: "Misc",
        child: [{
                name: "add",
                handler: addMessage,
                helpMessage: "Add a message to the list of predefined answers.",
                params: [{
                    id: "flags",
                    type: "flags",
                    options: {
                        opts: {
                            boolean: true
                        },
                        list: ["multi", "append"]
                    }
                }, {
                    id: "name",
                    type: "string",
                    required: true
                }, {
                    id: "message",
                    type: "multistr",
                    required: true
                }]
            },
            { name: "list", handler: listMessage, helpMessage: "Lists all messages." },
            /*{ name: "remove", hander: removeMessage, helpMessage: "Remove a message from the list of predefined messages (if more than one, use ID param)."},
             */
        ]
    }
}

function addMessage(e, args) {
    var messages = args.message.length;
    if (!args.flags.multi) {
        args.message[0] = args.message.join(' ');
        messages = 1;
    }
    e.code(JSON.stringify(args)).respond();

    database.find({
        "name": args.name
    }, function (err, res) {
        if (err) return (e.respond("**WHY DID I CRASH ?** \n```javascript\n" + JSON.stringify(err) + "```"));
        if (res.count > 0) {
            if (!args.flags.append) {
                e.mention().respond("There's already a message with this name. If you want to add a message to list of random messages, use the --append flag");
            } else {
                var lastID = -1;
                for (var i = 0; i < res.count; i++) {
                    if (res.result[i].msgid > lastID)
                        lastID = res.result[i].msgid;
                }

                for (var index = 0; index < messages; index++) {
                    database.insert({
                        "name": args.name,
                        "message": args.message[index],
                        "msgid": (lastID + index + 1),
                        "multiple": args.flags.multi || false
                    }, function (err, res, params) {
                        var index = index;
                        if (err) return (e.respond("**WHY DID I CRASH ?** \n```javascript\n" + JSON.stringify(err) + "```"));
                        if ((params.msgid-lastID-1) == messages - 1) {
                            e.mention().respond(`Appended ${messages} messages to the database under the alias **${args.name}**`);
                        }
                        return;
                    });
                }
            }
            return;
        } else {
            for (var index = 0; index < messages; index++) {
                database.insert({
                    "name": args.name,
                    "message": args.message[index],
                    "msgid": index,
                    "multiple": args.flags.multi || false
                }, function (err, res, params) {
                    var index = index;
                    if (err) return (e.respond("**WHY DID I CRASH ?** \n```javascript\n" + JSON.stringify(err) + "```"));
                    if (params.msgid == messages - 1) {
                        e.mention().respond(`Added ${messages} messages to the database under the alias **${args.name}**`);
                    }
                    return;
                });
            }

        } // end database exists counter if
    });
}

function listMessage(e, args) {
    var result = {};
    var count = 0;
    database.list(function (err, res) {
        if (err) return (e.logger.error(e.channelID, JSON.stringify(err)));
        for (var i = 0; i < res.count; i++) {
            result[res.result[i].name] = result[res.result[i].name] || [];
            result[res.result[i].name].push({"id": res.result[i].msgid, "message": res.result[i].message});
        }
        e.mention().respond("Check DM!");
        e.pm("Listing every message: \n\n```\n" + JSON.stringify(result, null, '\t') + "```");
    });
}

function predefinedMessage(e) {
    database.find({
        "name": e.command
    }, function (err, res) {
        if (err) return (e.logger.error(e.channelID, JSON.stringify(err)));
        if (res.count > 0) {
            e.respond(res.result[Math.floor(res.count * Math.random())].message);
        }
    });
}
