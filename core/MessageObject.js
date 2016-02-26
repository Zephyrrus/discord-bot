/*
 * Special thanks to Windston (https://github.com/Windsdon) for letting me use parts of his code
 * Licensed under MIT
 */

function MessageObject(disco, mod, serverID, user, userID, channelID, message, rawEvent, functions) {
  this._disco = disco;
  //this._mod = mod;
  //this.mod = disco.plugins.plugins[mod];
  this.serverID = serverID;
  this.user = user;
  this.userID = userID;
  this.channelID = channelID;
  this.message = message;
  this.rawEvent = rawEvent;
  this.logger = functions.logger; // will be deprecated soon-ish
  this.database = functions.database; // will be deprecated soon-ish
  this.nsfw = functions.nsfwEnabled; // will be deprecated soon-ish
  //this.db = disco.db.getAccess(mod);
  this._prepend = "";

  if (rawEvent && rawEvent._extend) {
    for (i in rawEvent._extend) {
      this[i] = rawEvent._extend[i];
    }
  }
}

MessageObject.prototype.respond = function (message, callback) {
  if (typeof (message) == "undefined") {
    message = "";
  }
  if (typeof (message) == "string") {
    message = this._prepend + message;
  }
  this._disco.queueMessage(this.channelID, message, callback);
  this._prepend = "";
  return this;
};

MessageObject.prototype.respondFile = function (file, callback) {
  this._disco.queueFile(this.channelID, file, callback);
  this._prepend = "";
  return this;
};

MessageObject.prototype.mention = function (uid) {
  if (typeof (uid) == "undefined") {
    uid = this.userID;
  }

  this._prepend += `<@${uid}> `;

  return this;
};

MessageObject.prototype.text = function (message) {
  this._prepend += message;

  return this;
};

MessageObject.prototype.code = function (message, lang) {
  this._prepend += "```"
  if (typeof (lang) == "string") {
    this._prepend += lang;
  }
  this._prepend += "\n";
  this._prepend += message;
  this._prepend += "\n```\n"

  return this;
};

MessageObject.prototype.n = function () {
  this._prepend += "\n";

  return this;
};

MessageObject.prototype.getName = function (uid) {
  return this._disco.getUserName(uid);
};

MessageObject.prototype.getUser = function (uid, sid) {
  if (typeof (uid) == "undefined") {
    uid = this.userID;
  }
  return this._disco.getUser(uid, sid);
};

MessageObject.prototype.editMessage = function (id, channelID, newMessage, callback) {
  if (!channelID) {
    channelID = this.channelID;
  }
  this._disco.editMessage(id, channelID, this._prepend + newMessage, callback);
  this._prepend = "";
  return this;
};

MessageObject.prototype.getMod = function (mod) {
  return this._disco.plugins.plugins[mod];
};

MessageObject.prototype.command = function (command, rawEvent) {
  rawEvent = rawEvent || {};
  this._disco.onMessage(this.user, this.userID, this.channelID, this.activator + command, rawEvent);
};

MessageObject.prototype.deleteMessage = function (id, channelID, callback) {
  if (typeof (id) == "function") {
    callback = id;
    id = undefined;
    channelID = undefined;
  }

  id = id || this.rawEvent.d.id;
  channelID = channelID || this.channelID;
  callback = callback || () => {};

  this._disco.deleteMessage(id, channelID, callback);
  return this;
};

// uid can be null to get server roles
MessageObject.prototype.getRoles = function (uid, sid) {
  if (typeof (uid) == "undefined") {
    uid = this.userID;
  }
  sid = sid || this.serverID;

  return this._disco.getRoles(uid, sid);
};

MessageObject.prototype.getRole = function (rid, sid) {
  if (typeof (sid) == "undefined") {
    sid = this.serverID;
  }

  return this._disco.getRole(rid, sid);
};

MessageObject.prototype.roleName = function (rid, sid) {
  try {
    return this.getRole(rid, sid).name;
  } catch (e) {
    return undefined;
  }
};

MessageObject.prototype.pm = function (message, uid, callback) {
  if (typeof (message) == "undefined") {
    message = "";
  }
  if (typeof (message) == "string") {
    message = this._prepend + message;
  }
  if (typeof (uid) == "function") {
    callback = uid;
    uid = this.userID;
  } else if (!uid) {
    uid = this.userID;
  }

  callback = callback || () => {};

  this._disco.queueMessage(uid, message, callback);
  this._prepend = "";
  return this;
};


MessageObject.prototype.respondLong = function (message, counter, lastLength) {
  var self = this;
  function _splitMessage(message, counter, lastLength){
    counter = counter || 1;
    var maxUncalculatedLength = 1900;
    var total = Math.ceil(message.length / maxUncalculatedLength);
    var aditionalLenght = 0;
    while (message[((lastLength || 0) + maxUncalculatedLength) + aditionalLenght] != "\n" && (maxUncalculatedLength + aditionalLenght) < 1990) {
      aditionalLenght++;
    }
    var currentSplice = message.substring((lastLength || 0), parseInt((lastLength || 0) + (maxUncalculatedLength + aditionalLenght)));
    self._disco.queueMessage(self.channelID, currentSplice, function () {
      if (counter < total) {
        respondLong(message, counter + 1, parseInt((maxUncalculatedLength + aditionalLenght)) + parseInt((lastLength || 0)));
      }
    });
  }
  if (typeof (message) == "undefined") {
    message = "";
  }
  if (typeof (message) == "string") {
    message = this._prepend + message;
  }
  _splitMessage(message);
  return this;
}

module.exports = MessageObject;
