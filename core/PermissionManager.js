var logger = require("winston");
var DatabaseHandler = require("./Database/databaseHandler.js");

function Permission(permissions) {
    if(typeof(permissions) == "string") {
        permissions = [permissions];
    } else if(typeof(permissions) == "undefined") {
        permissions = [];
    }
    this.permissions = [];
    var self = this;
    permissions.forEach(function(p) {
        if(/!?[a-z.*]+/.test(p)) {
            self.permissions.push(p);
        }
    })
}

/**
* @param Datastore db The database
*/
function PermissionManager(disco, callback) {
  this.usersDBStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "uid", type: "string", required: true},
    { name: "groups", type: "string", required: true}
  ]
  this.groupDBStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "`group`", type: "string", required: true},
    { name: "sid", type: "string", required: true},
    { name: "gid", type: "string", required: true},
    { name: "permissions", type: "string", required: true},
    { name: "roles", type: "string", required: true}
  ]
    this.db = new DatabaseHandler('permissions', this.groupDBStructure);
    this.dbUsers = new DatabaseHandler('users', this.usersDBStructure);
    this.groupCache = {};
    this.userCache = {};
    this.disco = disco;
    this.load(callback);
}

/**
* Caches all groups to avoid a callback hell when getting user permissions
*/
PermissionManager.prototype.load = function(callback) {
    logger.info("[PERM_SYSTEM]: Reloading permissions");
    var self = this;

    this.db.list(function(err, docs) {
        if(err) {
            logger.error(err);
            if(typeof(callback) == "function") {
                callback(false);
            }
            return;
        }

        self.groupCache = {};

        docs.result.forEach(function(e) {
            delete e["id"];
            try{
              e.permissions = JSON.parse(e.permissions);
              e.roles = JSON.parse(e.roles);
            }catch(exception){
              logger.error("[PERM_SYSTEM_GROUP]: Can't parse " + e.permissions);
              logger.error("[PERM_SYSTEM_GROUP]: Can't parse " + e.roles);
            }
            self.groupCache[e.sid + ":" + e.group] = e;
        });

        // cache users
        self.dbUsers.list(function(err, docs) {
            if(err) {
                logger.error(err);
                if(typeof(callback) == "function") {
                    callback(false);
                }
                return;
            }

            self.userCache = {};

            docs.result.forEach(function(e) {
                delete e["id"];
                try{
                  e.groups = JSON.parse(e.groups);
                }catch(exception){
                  logger.error("[PERM_SYSTEM_USER]: Can't parse " + e.groups)
                }
                self.userCache[e.uid] = e;
            });

            // create global guest
            if(!self.groupCache[`0:guest`]) {
                self.createGroup("guest", "0");
            }

            logger.info("[PERM_SYSTEM]: Finished reloading permissions");

            if(typeof(callback) == "function") {
                callback(self);
            }
        });
    });
}

/**
* Tests if a user has a certain permission
* @param string uid user ID
* @param Permission permissions
* @param string sid server ID
* @return true|false
*/
PermissionManager.prototype.canUser = function(uid, permissions, sid) {
    if(!permissions) {
        return true;
    }

    if(permissions.constructor == Permission) {
        permissions = permissions.permissions;
    }

    if(permissions.constructor != Array) {
        permissions = [permissions];
    }

    if(permissions.length == 0) {
        return true;
    }

    var groups = this.getUserGroups(uid, sid);
    var can = false;
    for (var i in groups) {
        if (groups.hasOwnProperty(i)) {
            if(this._canGroup(groups[i], permissions)) {
                can = true;
                break;
            }
        }
    }

    return can;
}

/**
* Tests if a group has a certain permission
* Internal method
* @param string|object group full group id (sid:gid) or group object
* @param array permissions permission list
* @return true|false
*/
PermissionManager.prototype._canGroup = function(group, permissions) {
    if(typeof(group) == "string") {
        if(!this.groupExists(group)) {
            logger.debug("[PERM_SYSTEM]: Looking for invalid group: " + group);
            return false;
        }

        group = this.groupCache[group];
    }

    if(typeof(permissions) == "string") {
        permissions = [permissions];
    }

    var hasPerm = true;

    permissions.forEach(function(perm) {
        if(!hasPerm) {
            return;
        }
        if(typeof(perm) != "string") {
            return;
        }
        var pp = perm.split(".");
        var result = false;
        var depth = 0;
        for(var i in group.permissions) {
            var gp = group.permissions[i];
            var deny = false;

            if(gp[0] == "!") {
                deny = true;
                gp = gp.substring(1);
            }

            gp = gp.split(".");

            if(gp.length < depth) {
                continue;
            }

            var related = true;
            if(gp.length > pp.length || (gp.length != pp.length && gp[gp.length - 1] != "*")) {
                related = false;
            } else {
                for(var j in gp) {
                    if(pp[j] != gp[j] && gp[j] != "*") {
                        related = false;
                        break;
                    }
                }
            }

            if(!related) {
                continue;
            }

            result = !deny;
            depth = gp.length;
        }

        hasPerm = (hasPerm && result);
    });

    return hasPerm;
}

PermissionManager.prototype.getUserGroups = function(uid, sid) {
    var groups = this.getGroups(sid);

    var ugroups = {};
    var self = this;
    var uroles = this.disco.getRoles(uid) || {};
    groups.forEach(function(g){
        if(self.userHasGroup(g, uid, uroles)) {
            ugroups[g.sid + ":" + g.group] = g;
        }
    });

    return ugroups;
}

PermissionManager.prototype.groupHasUser = function(group, uid, uroles) {
    return this.userHasGroup(group, uid, uroles);
}

PermissionManager.prototype.userHasGroup = function (group, uid, uroles) {
    if(typeof(group) == "string") {
        group = this.getGroup(group);
    }

    if(!group) {
        return false;
    }

    if(group.group == "guest" || (this.userCache[uid] && this.userCache[uid].groups.indexOf(group.gid) != -1)) {
        return true;
    }

    if(!group.roles || group.roles.length == 0) {
        return false;
    }

    uroles = uroles || this.disco.getRoles(uid) || {};

    var fromRole = false;
    Object.keys(uroles).forEach(function(v) {
        if(!group.roles) {
            return;
        }

        if(group.roles.indexOf(v) != -1) {
            fromRole = true;
        }
    });

    if(fromRole) {
        return true;
    }

    return false;
};

PermissionManager.prototype.getGroup = function (group, sid) {
    var gid = this.getGID(group, sid);

    if(this.groupCache[gid]) {
        return this.groupCache[gid];
    }

    return false;
};

/**
* If no sid is provided, this group becomes global (sid = 0)
* Group can be sid:name as well
* @return object|null new group
*/
PermissionManager.prototype.createGroup = function(group, sid, callback) {
    callback = callback || (() => {});

    try {
        var gid = this.getGID(group, sid);
    } catch(e) {
        callback(e);
        return null;
    }

    if(this.groupExists(group, sid)) {
        logger.warn("[PERM_SYSTEM]: This group already exists '" + sid + ":" + group + "''");
        callback(new Error("This group already exists"));
        return null;
    }

    var group = gid.split(":")[1];
    var sid = gid.split(":")[0];

    var g = {
        group: group,
        sid: sid,
        permissions: [],
        gid: gid
    };


    // make a local copy on the cache
    this.groupCache[gid] = g;

    this.db.insert({"`group`": group, sid: sid, permissions: JSON.stringify([]), gid: gid, roles: JSON.stringify([])}, function (err, newDocs) {
        if(err) {
            logger.error("[PERM_SYSTEM]: Error while saving group");
            logger.error(err);
        }
        callback(err, newDocs); // id what this does
    });

    return g;
}

/**
* Removes a group
* callback(err)
* @return bool success
*/
PermissionManager.prototype.removeGroup = function (group, sid, callback) {
    callback = callback || (() => {});
    try {
        var gid = this.getGID(group, sid);
    } catch(e) {
        callback(e);
        return false;
    }

    if(!this.groupExists(group, sid)) {
        var msg = `This group doesnt exist: group = ${group}, sid = ${sid}`;
        logger.warn(msg);
        callback(new Error(msg))
        return false;
    }

    // delete the cached version
    delete this.groupCache[sid + ":" + group];

    // PORT TO SQLITE
    this.db.delete({
        gid: gid
    }, function (err, newDocs) {
        if(err) {
            logger.error("[PERM_SYSTEM]: Error while removing group");
            logger.error(err);
            callback(err);
        }

    });

    return true;
};

PermissionManager.prototype.getAllUsers = function () {
    var users = [];
    for (var sid in this.disco.bot.servers) {
        if (this.disco.bot.servers.hasOwnProperty(sid)) {
            for (var uid in this.disco.bot.servers[sid].members) {
                if (this.disco.bot.servers[sid].members.hasOwnProperty(uid)) {
                    if(users.indexOf(uid) == -1) {
                        users.push(uid);
                    }
                }
            }
        }
    }

    return users;
};

PermissionManager.prototype.getUsersInGroup = function (group, sid) {
    var gid = this.getGID(group, sid);

    var users = [];
    var self = this;

    this.getAllUsers().forEach(function(v) {
        if(self.groupHasUser(gid, v)) {
            users.push(v);
        }
    });

    return users;
};

/**
* If no sid is provided, returns all groups
* always includes global groups
*/
PermissionManager.prototype.getGroups = function(sid) {
    if(typeof(sid) == "undefined") {
        sid = 0;
    }

    // make guest group
    if(!this.groupCache[`${sid}:guest`]) {
        this.createGroup("guest", sid);
    }

    var groups = [];

    for (var i in this.groupCache) {
        if (this.groupCache.hasOwnProperty(i)) {
            var g = this.groupCache[i];
            if(g.sid == sid || g.sid == 0) {
                groups.push(g);
            }
        }
    }

    return groups;
}

PermissionManager.prototype.groupExists = function(group, sid) {
    var gid = this.getGID(group, sid);

    return !!this.groupCache[gid];
}

PermissionManager.prototype.groupGrant = function(permissions, group, sid) {
    return this._groupAddPermissions(permissions, this.getGID(group, sid));
}

PermissionManager.prototype.groupUnGrant = function(permissions, group, sid) {
    return this._groupRemovePermissions(permissions, this.getGID(group, sid));
}

PermissionManager.prototype.groupDeny = function(permissions, group, sid) {
    if(typeof(permissions) == "string") {
        permissions = [permissions];
    }
    permissions.forEach(function(v, i) {
        permissions[i] = "!" + v;
    });
    return this._groupAddPermissions(permissions, this.getGID(group, sid));
}

PermissionManager.prototype.groupUnDeny = function(permissions, group, sid) {
    if(typeof(permissions) == "string") {
        permissions = [permissions];
    }
    permissions.forEach(function(v, i) {
        permissions[i] = "!" + v;
    });
    return this._groupRemovePermissions(permissions, this.getGID(group, sid));
}

PermissionManager.prototype.getGID = function(group, sid) {
    var gid = "";

    if(typeof(sid) == "undefined") {
        sid = "0";
    }

    if(/^[0-9]+:[a-zA-Z]+$/.test(group)) {
        gid = group;
    } else if(/^[0-9]+$/.test(sid) && /^[a-zA-Z0-9]+$/.test(group)) {
        gid = sid + ":" + group;
    } else {
        throw new Error("[PERM_SYSTEM]: Invalid group name: group = " + group + ", sid = " + sid);
    }

    return gid;
}

PermissionManager.prototype._groupAddPermissions = function(permissions, gid) {
    if(!this.groupCache[gid]) {
        logger.warn("[PERM_SYSTEM]: No group " + gid);
        return false;
    }

    if(typeof(permissions) == "undefined") {
        logger.warn("[PERM_SYSTEM]: permissions is a required argument");
        return false;
    }

    if(typeof(permissions) == "string") {
        permissions = [permissions];
    }

    if(permissions.constructor == Array) {
        permissions = new Permission(permissions);
    }

    if(permissions.constructor != Permission) {
        logger.warn("[PERM_SYSTEM]: Invalid permission object");
        return false;
    }

    var g = this.groupCache[gid];

    permissions.permissions.forEach(function(perm) {
        if(g.permissions.indexOf(perm) != -1) {
            return;
        }
        logger.info("[PERM_SYSTEM]: Added permission " + perm + " to group " + gid);
        g.permissions.push(perm);
    });

    this._updateGroup(gid);

    return true;
}

PermissionManager.prototype._groupRemovePermissions = function(permissions, gid) {
    if(!this.groupCache[gid]) {
        logger.warn("No group " + gid);
        return false;
    }

    if(typeof(permissions) == "string") {
        permissions = [permissions];
    }

    if(permissions.constructor == Array) {
        permissions = new Permission(permissions);
    }

    if(permissions.constructor != Permission) {
        logger.warn("[PERM_SYSTEM]: Invalid permission object");
        return false;
    }

    var g = this.groupCache[gid];

    permissions.permissions.forEach(function(perm) {
        if(g.permissions.indexOf(perm) == -1) {
            return;
        }
        logger.info("[PERM_SYSTEM]: Removed permission " + perm + " from group " + gid);
        g.permissions.splice(g.permissions.indexOf(perm), 1);
    });

    this._updateGroup(gid);

    return true;
}

PermissionManager.prototype.addUserToGroup = function(uid, group, sid) {
    if(!group || !uid) {
        logger.warn("[PERM_SYSTEM]: addUserToGroup with empty parameters");
        return {
            success: false
        };
    }

    var gid = this.getGID(group, sid);

    if(!this.groupCache[gid]) {
        logger.warn("[PERM_SYSTEM]: addUserToGroup Group doesn't exist: " + gid);
        return {
            success: false
        };
    }

    if(!this.userCache[uid]) {
        this.createUser(uid);
    }

    if(this.userCache[uid].groups.indexOf(gid) != -1) {
        logger.debug("[PERM_SYSTEM]: User " + uid + " already in group " + gid);
        return {
            success: true
        };
    }

    this.userCache[uid].groups.push(gid);

    logger.info("[PERM_SYSTEM]: Added " + uid + " to group " + gid);

    this._updateUser(uid);

    return {
        success: true
    };
}

PermissionManager.prototype.removeUserFromGroup = function(uid, group, sid) {
    if(!group || !uid) {
        logger.warn("[PERM_SYSTEM]: removeUserFromGroup with empty parameters");
        return {
            success: false
        };
    }

    var gid = this.getGID(group, sid);

    if(!this.groupCache[gid]) {
        logger.warn("[PERM_SYSTEM]: removeUserFromGroup Group doesn't exist: " + gid);
        return {
            success: false
        };
    }

    if(!this.userCache[uid]) {
        return {
            success: true
        };
    }

    if(this.userCache[uid].groups.indexOf(gid) == -1) {
        logger.debug("[PERM_SYSTEM]: User " + uid + " not in group " + gid);
        return {
            success: true
        };
    }

    this.userCache[uid].groups.splice(this.userCache[uid].groups.indexOf(gid), 1);

    logger.info("[PERM_SYSTEM]: Removed " + uid + " from group " + gid);

    this._updateUser(uid);

    return {
        success: true
    };
}


PermissionManager.prototype.createUser = function (uid) {
    var u = {
        uid: uid,
        groups: []
    };

    this.userCache[uid] = u;

    this.dbUsers.insert({uid:uid, groups:JSON.stringify([])}, function(err, res) {
        if(err) {
            logger.error(err);
        }
    });
};

PermissionManager.prototype._updateGroup = function(gid) {
    this.db.update({
        gid: gid
    }, {permissions: JSON.stringify(this.groupCache[gid].permissions), gid: gid, sid: this.groupCache[gid].sid, roles: JSON.stringify(this.groupCache[gid].roles)}, function(err, res) {
        if(err) {
            logger.error(err);
        }
    })
}

PermissionManager.prototype._updateUser = function(uid) {
      // PORT TO SQLITE
    this.dbUsers.update({
        uid: uid
    }, {groups: JSON.stringify(this.userCache[uid].groups)}, function(err) {
        if(err) {
            logger.error(err);
        }
    })
}

PermissionManager.prototype.createPrivilegeKey = function (gid, callback) {
    var key = require("crypto").randomBytes(32).toString('hex');
      // PORT TO SQLITE
    this.dbKeys.insert({
        key: key,
        gid: gid
    }, callback);

    return key;
};

PermissionManager.prototype.applyPrivilegeKey = function (uid, key, callback) {
    var self = this;
    logger.info(`[PERM_SYSTEM]: Attempting to apply key ${key} to ${uid}`);
      // PORT TO SQLITE
    this.dbKeys.find({
        key: key
    }, function(err, data) {
        logger.info(data);
        if(err || data.length == 0) {
            if(typeof(callback) == "function") {
                callback(false);
            }
            return;
        } else {
            self.addUserToGroup(uid, data[0].gid);
            self.dbKeys.delete({
                id: data[0]._id
            }, function(err, res) {
              if(err) {
                  logger.error(err);
              }
                if(typeof(callback) == "function") {
                    callback(data[0].gid);
                }
            });
            return;
        }
    })
};

PermissionManager.prototype.roleAdd = function (group, sid, role) {
    var g = this.getGroup(group, sid);

    if(!g) {
        logger.error("[PERM_SYSTEM]: No group with id " + group + " on server " + sid)
        return false;
    }

    if(!/^[0-9]+$/.test(role)) {
        logger.error("[PERM_SYSTEM]: Not a valid role: " + role)
        return false;
    }

    if(!g.roles) {
        g.roles = [];
    }

    if(g.roles.indexOf(role) != -1) {
        return true;
    }

    g.roles.push(role);

    this._updateGroup(g.gid);

    return true;
};

PermissionManager.prototype.roleRemove = function (group, sid, role) {
    var g = this.getGroup(group, sid);

    if(!g) {
        logger.error("[PERM_SYSTEM]: No group with id " + group + " on server " + sid)
        return false;
    }

    if(!g.roles) {
        g.roles = [];
    }

    if(g.roles.indexOf(role) == -1) {
        return true;
    }

    g.roles.splice(g.roles.indexOf(role), 1);

    this._updateGroup(g.gid);

    return true;
};

module.exports = {
    Permission: Permission,
    PermissionManager: PermissionManager
};
