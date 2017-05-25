/*
 * Special thanks to Windsdon (https://github.com/Windsdon) for letting me use parts of his code
 * Licensed under MIT
 */

function MessageObject(disco, mod, serverID, user, userID, channelID, message, rawEvent, configs, functions, flags) {
  this._disco = disco;
  this.serverID = serverID;
  this.user = user;
  this.userID = userID;
  this.channelID = channelID;
  this.message = message;
  this.rawEvent = rawEvent;
  this.command = configs.command;
  
  this.database = configs.database; // will be deprecated soon-ish
  this.language = configs.language;
  this.config = disco.config; // will be deprecated soon-ish

  this.logger = functions.logger; // will be deprecated soon-ish

  this.flags = {};
  this.flags.nsfwEnabled = flags.nsfwEnabled; // dafuq I am doing here o.O
  this.allowNSFW = flags.nsfwEnabled; // will be deprecated soon-ish
  this.flags.isPM = flags.isPM;

  this._prepend = "";
  this._postpend = "";
  this._embed = undefined;

  if (rawEvent && rawEvent._extend) {
    for (var i in rawEvent._extend) {
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
  this._disco.queueMessage(this.channelID, message, this._embed, callback);
  this._prepend = "";
  this._embed = undefined;

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
  this._prepend += "```";
  if (typeof (lang) == "string") {
    this._prepend += lang;
  }
  if(typeof (message) == "object"){
    message = JSON.stringify(message);
  }
  this._prepend += "\n";
  this._prepend += message;
  this._prepend += "\n```\n";

  return this;
};

MessageObject.prototype.n = function () {
  this._prepend += "\n";

  return this;
};

MessageObject.prototype.getName = function (uid, noEscape) {
     if(noEscape) {
         return this._disco.getUserName(uid);
     } else {
         return this.clean(this._disco.getUserName(uid));
     }
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
  callback = callback || ((() => {}))

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

  callback = callback || ((() => {}));

  this._disco.queueMessage(uid, message, this._embed, callback);
  this._prepend = "";
  return this;
};

MessageObject.prototype.embed = function (embed, message) {
  if(typeof (embed) != "object"){
    return this;
  }
  this._embed = embed;

  if (typeof (message) == "string") {
    this._prepend += message;
  }

  return this;
};

/**
* Escapes @, *, _, ~, # and `
*/
MessageObject.prototype.clean = function (text) {
    text = text || "";
    try {
        return text.replace(/[#@`*_~]/g, "\u200B$&");
    } catch(err) {
        return "";
    }
};

MessageObject.prototype.canUser = function(permissions, uid, sid) {
    uid = uid || this.userID;
    sid = sid || this.serverID;

    return this._disco.pm.canUser(uid, permissions, sid);
}

module.exports = MessageObject;
