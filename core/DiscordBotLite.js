/*
 * Special thanks to Windsdon (https://github.com/Windsdon) for letting me use parts of his code
 * Licensed under MIT
 */
var PermissionManager = require("./PermissionManager.js");
var CommandManager = require("./CommandManager.js");
var logger = require("winston");
var fs = require("fs");
var async = require("async");

function DiscordBot(bot) {
    this.bot = bot;

    logger.info("Starting");
    this._version = require("../package.json").version;
    this._startTime = new Date();
    this.pm = new PermissionManager.PermissionManager(this, function() {});
    this.cm = new CommandManager(this);
    this.databaseHandler = require("./Database/databaseHandler.js");
    this.outbound = {};
}

DiscordBot.prototype.getServerID = function (channelID) {
    for (var sid in this.bot.servers) {
        if (this.bot.servers.hasOwnProperty(sid)) {
            if (Object.keys(this.bot.servers[sid].channels).indexOf(channelID) != -1) {
                return sid;
            }
        }
    }

    // global: private message
    return 0;
};

DiscordBot.prototype.getOutbound = function (channelID) {
    var self = this;

    function trySend(task, callback, attempts) {
        if (!attempts) {
            attempts = 0;
        }
        if (task.message) {
            if (task.message.length >= 2000) {
                var warn = "*This message was longer than 2000 characters and has been reduced*\n ";
                task.message = warn + task.message.substring(0, 2000 - warn.length - 1);
            }
            self.bot.sendMessage(task, function (err, response) {
                if (err) {
                    if (err.statusCode == 429) { // ratelimited
                        logger.warn("Rate limited! Attempt #" + attempts);
                        setTimeout(function () {
                            trySend(task, callback, attempts++);
                        }, (err.retry_after || 0) + 1000);
                        return;
                    }else{
                      logger.error("[SEND_MESSAGE]: " + JSON.stringify(err));
                    }
                }
                callback(err, response);
            });
        } else if (task.file) {
            self.bot.uploadFile(task, function (err, response) {
                if (err) { // rate limited!
                    logger.warn(err);
                    logger.warn("Rate limited! Attempt #" + attempts);
                    setTimeout(function () {
                        trySend(task, callback, attempts++);
                    }, (err.retry_after || 0) + 1000);
                    return;
                }
                callback(err, response);
            });
        }
    }
    if (!this.outbound[channelID]) {
        this.outbound[channelID] = async.queue(trySend, 1);
    }

    return this.outbound[channelID];
};

DiscordBot.prototype.queueMessage = function (channelID, message, callback) {
    if (typeof (message) == "string") {
        this.getOutbound(channelID).push({
            to: channelID,
            message: message
        }, callback);
    } else {
        this.getOutbound(channelID).push(message, callback);
    }
};

DiscordBot.prototype.queueFile = function (channelID, file, callback) {
    if (typeof (file) == "string") {
      this.getOutbound(channelID).push({
            to: channelID,
            file: file
       }, callback);
    } else if(file.path) {
        this.getOutbound(channelID).push({
            to: channelID,
            file: file.path
        }, callback);
    } else {
        this.getOutbound(channelID).push({
            to: channelID,
            file: file
        }, callback);
    }
};

DiscordBot.prototype.getUserName = function (uid) {
    for (var sid in this.bot.servers) {
        if (this.bot.servers.hasOwnProperty(sid)) {
            for (var member in this.bot.servers[sid].members) {
                if (this.bot.servers[sid].members.hasOwnProperty(member)) {
                    if (member == uid) {
                        return this.bot.servers[sid].members[member].user.username
                    }
                }
            }
        }
    }

    logger.debug("Can't find username for " + uid);

    return uid;
};

DiscordBot.prototype.getUser = function (uid, _sid) {
    for (var sid in this.bot.servers) {
        if (this.bot.servers.hasOwnProperty(sid)) {
            if (typeof (_sid) != "undefined" && sid != _sid) {
                continue;
            }
            for (var member in this.bot.servers[sid].members) {
                if (this.bot.servers[sid].members.hasOwnProperty(member)) {
                    if (member == uid) {
                        return this.bot.servers[sid].members[member].user;
                    }
                }
            }
        }
    }

    logger.debug("Can't find user " + uid);

    return null;
};

DiscordBot.prototype.editMessage = function (id, channelID, newMessage, callback) {
    this.bot.editMessage({
        channel: channelID,
        messageID: id,
        message: newMessage
    }, callback);
};

DiscordBot.prototype.deleteMessage = function (id, channelID, callback) {
    this.bot.deleteMessage({
        channel: channelID,
        messageID: id
    }, callback);
};

DiscordBot.prototype.getRole = function (rid, sid) {
    if (sid) {
        if (!this.bot.servers[sid]) {
            return null;
        } else {
            return this.bot.servers[sid].roles[mrid] || null;
        }
    } else {
        for (var sid in this.bot.servers) {
            if (this.bot.servers.hasOwnProperty(sid)) {
                for (var mrid in this.bot.servers[sid].roles) {
                    if (this.bot.servers[sid].roles.hasOwnProperty(mrid)) {
                        if (mrid == rid) {
                            return this.bot.servers[sid].roles[mrid];
                        }
                    }
                }
            }
        }
    }
};

DiscordBot.prototype.getRoles = function (uid, sid) {
    var roles = {};
    var self = this;
    if (!sid) {
        if (!uid) {
            return null;
        } else {
            for (var sid in this.bot.servers) {
                if (this.bot.servers.hasOwnProperty(sid)) {
                    for (var muid in this.bot.servers[sid].members) {
                        if (this.bot.servers[sid].members.hasOwnProperty(muid)) {
                            if (muid == uid) {
                                this.bot.servers[sid].members[muid].roles.forEach(function (v) {
                                    if (!roles[v]) {
                                        roles[v] = self.getRole(v, sid);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        return roles;
    }
    if (!this.bot.servers[sid]) {
        return null;
    }
    if (uid == null) {
        for (var mrid in this.bot.servers[sid].roles) {
            roles[mrid] = this.bot.servers[sid].roles[mrid];
        }
        return roles;
    }
    for (var uid in this.bot.servers[sid].members) {
        if (this.bot.servers[sid].members.hasOwnProperty(uid)) {
            this.bot.servers[sid].members[uid].forEach(function (v) {
                roles[v] = self.getRole(v, sid);
            });
        }
    }

    return roles;
};

module.exports = DiscordBot;
