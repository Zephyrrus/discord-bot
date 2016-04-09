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
        if(!attempts) {
            attempts = 0;
        }
        if(task.message) {
            if(task.message.length >= 2000) {
                var warn = "**This message was longer than 2000 characters and has been split**\n\n";
                var parts = self.splitMessage(warn + task.message, 1990);
                logger.debug("Split message into " + parts.length + " parts.");
                parts.forEach(function(v) {
                    self.queueMessage(channelID, v);
                });
                callback();
                return;
            }
            self.bot.sendMessage(task, function(err, response) {
                if(err) {
                    logger.warn(err);
                    if(err.statusCode == 429) { // ratelimited
                        logger.warn("Rate limited! Attempt #" + attempts);
                        setTimeout(function() {
                            trySend(task, callback,  attempts++);
                        }, (err.retry_after || 0) + 1000);
                        return;
                    }
                }
                callback(err, response);
            });
        } else if(task.file) {
            self.bot.uploadFile(task, function(err, response) {
                if(err) {
                    logger.warn(err);
                    if(err.statusCode == 429) { // ratelimited
                        logger.warn("Rate limited! Attempt #" + attempts);
                        setTimeout(function() {
                            trySend(task, callback,  attempts++);
                        }, (err.retry_after || 0)  + 1000);
                        return;
                    }
                }
                callback(err, response);
            });
        }
    }
    if(!this.outbound[channelID]) {
        this.outbound[channelID] = async.queue(trySend, 1);;
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
                        return this.bot.servers[sid].members[member].user.username;
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
            return this.bot.servers[sid].roles[rid] || null;
        }
    } else {
        for (var _sid in this.bot.servers) {
            if (this.bot.servers.hasOwnProperty(_sid)) {
                for (var mrid in this.bot.servers[_sid].roles) {
                    if (this.bot.servers[_sid].roles.hasOwnProperty(mrid)) {
                        if (mrid == rid) {
                            return this.bot.servers[_sid].roles[mrid];
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
            for (var _sid in this.bot.servers) {
                if (this.bot.servers.hasOwnProperty(_sid)) {
                    for (var muid in this.bot.servers[_sid].members) {
                        if (this.bot.servers[_sid].members.hasOwnProperty(muid)) {
                            if (muid == uid) {
                                this.bot.servers[_sid].members[muid].roles.forEach(function (v) {
                                    if (!roles[v]) {
                                        roles[v] = self.getRole(v, _sid);
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
    if (uid === null) {
        for (var mrid in this.bot.servers[sid].roles) {
            roles[mrid] = this.bot.servers[sid].roles[mrid];
        }
        return roles;
    }
    for (var _uid in this.bot.servers[sid].members) {
        if (this.bot.servers[sid].members.hasOwnProperty(uid)) {
            this.bot.servers[sid].members[_uid].forEach(function (v) {
                roles[v] = self.getRole(v, sid);
            });
        }
    }

    return roles;
};

DiscordBot.prototype.setStatus = function(str, idle){
  if(!str) str = "nothing";
  if(!idle) idle = null;
  this.bot.setPresence({
      idle_since: idle,
      game: str
  });
};

DiscordBot.prototype.splitMessage = function(message, chunkSize) {
    chunkSize = chunkSize || 1990;
    var preChunks = [];
    message.split("\n").forEach(function(v) {
        if(v.length < chunkSize) {
            preChunks.push(v);
        } else {
            var vParts = [""];
            v.split(" ").forEach(function(vv) {
                if(vv.length > chunkSize) {
                    var vvParts = vv.match(new RegExp('.{1,' + chunkSize + '}', 'g'));
                    vParts = vParts.concat(vvParts);
                } else {
                    if(vParts[vParts.length - 1].length + vv.length < chunkSize) {
                        vParts[vParts.length - 1] += " " + vv
                    } else {
                        vParts.push(vv);
                    }
                }
            });
            vParts.forEach(function(v) {
                preChunks.push(v);
            });
        }
    });

    var chunks = [""];
    while(preChunks.length > 0) {
        var str = preChunks.shift();
        if(chunks[chunks.length - 1].length + str.length < chunkSize) {
            chunks[chunks.length - 1] += str + "\n";
        } else {
            if(/```/gi.test(chunks[chunks.length - 1])) {
                chunks[chunks.length - 1] += "```";
                chunks.push("```" + str + "\n");
            } else {
                chunks.push(str + "\n");
            }
        }
    }

    return chunks;
}

module.exports = DiscordBot;
