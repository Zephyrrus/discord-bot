var request = require("request");
var logger = require("winston");
var async = require("async");

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Core commands",
        version: "1.3.0",
        author: "Zephy",
        description: "Core commands",
    },
    "ping": {
        permission: "ping",
        helpMessage: "pong!",
        category: "Info",
        handler: ping,
    },
    "id": {
        permission: "id",
        helpMessage: "hows the id of the requested channel/user/etc",
        category: "Info",
        handler: getID,
        params: [{
            id: "param",
            type: "string",
            required: false
        }]
    },
    "echo": {
        helpMessage: "the bot will repeat your message.",
        category: "Misc",
        handler: echo,
        child: [
            { name: "-h", handler: echoH, helpMessage: "the bot will repeat your message (without mentioning you)", permission: "echo.hide" },
        ]
    },
    "purge": {
        helpMessage: "Purge messages on the current channel. --all overrides count.",
        category: "Moderation",
        handler: purge,
        params: [{
            id: "flags",
            type: "flags",
            options: {
                opts: {
                    boolean: true
                },
                list: ["all"]
            }
        }, {
            id: "count",
            type: "number",
            required: true
        }, {
            id: "user",
            type: "mention",
            required: false
        }]
    }
};

function ping(e, args) {
    var _delay;
    e.mention().respond("Pong!", function (err, res) {
        if (err) return;
        _delay = new Date(res.timestamp).getTime() - new Date(e.rawEvent.d.timestamp).getTime();
        e._disco.bot.editMessage({
            channel: res.channel_id,
            messageID: res.id,
            message: "<@" + e.userID + "> Pong\nNetwork delay: **" + _delay + "** ms"
        });
    });
}

function getID(e, args) {
    if (args.param) {
        if (args.param.toLowerCase() == "channel") {
            e.respond("Channel ID => `" + e.channelID + "`")
        } else if (args.param.toLowerCase() == "server") {
            e.respond("Server ID => `" + e._disco.bot.serverFromChannel(e.channelID) + "`");
        } else if (args.param.indexOf("<@") > -1 && args.param.indexOf(">") > -1) {
            e.respond(args.param + " => `" + args.param.substring(2, args.param.length - 1) + "`");
        } else {
            e.mention().respond("=> `@" + e.userID + "`");
        }
    } else {
        e.mention().respond("=> `@" + e.userID + "`");
    }
}

function echo(e, args) {
    e.deleteMessage();
    e.respond(args._str + " [<@" + e.userID + ">]");
}

function echoH(e, args) {
    e.deleteMessage();
    e.respond(args._str);
}

function purge(e, args) {
    function remove(before, count, callback) {
        logger.debug("Call to remove before: " + before);
        request({
            url: "https://ptb.discordapp.com/api/channels/" + e.channelID + "/messages?limit=" + count,
            headers: {
                authorization: e._disco.bot.internals.token
            }
        }, function(err, response, body) {
            if(err) {
                callback(err);
                return;
            }

            var data = JSON.parse(body);

            if(args.user) {
                data = data.filter(function(v) {
                    return v.author.id == args.user;
                });
            }

            var last = null;

            var q = async.queue(function(message, cb) {
                logger.verbose("Delete message: " + message.id + " from: " + message.author.id);
                function _delete(id, channel, cb2) {
                    e.deleteMessage(id, channel, function(err2, data) {
                        if(err2 && err2.statusCode == 429) {
                            logger.warn("Rate limit", err2)
                            setTimeout(function() {
                                _delete(id, channel, cb2);
                            }, err2.retry_after + 1000);
                            return;
                        }
                        if(!err) {
                            last = id;
                        }
                        cb2(err2);
                    })
                }

                _delete(message.id, e.channelID, cb);
            });

            q.drain = function(err) {
                callback(err, data, last);
            }
            q.push(data);
        });
    }


    function removeMore(before, count, callback) {
        var limit = count > 100 ? 100 : count;
        remove(before, limit, function(err, data, last) {
            if(err || !data) {
                callback(err);
            }

            if(count - limit <= 0) {
                callback(err, data, last);
            } else {
                removeMore(err, count - limit, callback);
            }
        })
    }

    if(args.flags.all) {
        if(!e.canUser("purge.all")) {
            e.mention().respond("You can't use the --all flag!");
            return;
        }
        function iterate(err, data, last) {
            if(err) {
                logger.error(err);
                e.code(err.message).respond();
                return;
            }
            if(last) {
                removeMore(last, 100, iterate);
            } else {
                e.code("Done").respond();
            }
        }
        removeMore(e.rawEvent.d.id, 100, iterate);
        e.respond("**Purging everything in this channel**");
        return;
    }

    if(args.user) {
        e.respond("**Purging messages from __" + e.getName(args.user) + "__**");
    } else {
        e.respond("**Purging message**");
    }

    removeMore(e.rawEvent.d.id, args.count, function(err) {
        if(err) {
            logger.error(err);
            e.code(err.message).respond();
            return;
        }
        logger.debug("Done!");
        e.code("Done!").respond();
    });



}
