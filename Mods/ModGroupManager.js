var logger = require("winston");

function groupList(e, args) {
    var cache = e._disco.pm.groupCache;

    var str = "```\n";

    for (var group in cache) {
        if (cache.hasOwnProperty(group) && (cache[group].sid == e.serverID || cache[group].sid == '0')) {
            if (cache[group].group == "guest") {
                // ignore guest groups
                continue;
            }
            str += `Group ${group}\n`;
            var list = [];
            var users = e._disco.pm.getUsersInGroup(group);
            if (cache[group].roles && cache[group].roles.length != 0) {
                str += `    Role links: `;
                var roles = [];
                cache[group].roles.forEach(function (v) {
                    roles.push(e.roleName(v, null));
                })
                str += roles.join(", ") + "\n";
            }
            // I may change back in the future
            if (cache[group].group == "guest") {
                str += `    Ignoring ${users.length} users in this guest group\n`;
                continue;
            }
            users.forEach(function (v) {
                list.push(e.getName(v));
            });
            str += "    ";
            str += list.join(", ") + "\n\n";
        }
    }

    str += "\n```";

    e.respond(str);
}

function groupView(e, args) {
    var group = e._disco.pm.getGroup(args.group, args.where == "here" ? e.serverID : undefined);

    if (group == false) {
        e.mention().respond("This group doesn't exist");
        return;
    }

    var str = "```\n";

    str += `Group ${group.gid}\n`;
    str += "    Members: \n";
    var list = [];
    var users = e._disco.pm.getUsersInGroup(group.gid);
    users.forEach(function (v) {
        list.push(e.getName(v));
    });

    if (list.length > 30) {
        list = ["Too many users to list (" + users.length + ")!"];
    }

    str += "        " + list.join("\n        ") + "\n";

    str += "    Permissions:\n";
    str += "        " + group.permissions.join("\n        ") + "\n";

    str += "\n```";

    e.respond(str);
}

function groupJoin(e, args) {
    var uid = args.user ? args.user : e.userID;
    var sid = (args.where == "here" ? e.serverID : undefined);
    var result = e._disco.pm.addUserToGroup(uid, args.group, sid);
    if (result.success) {
        e.mention().respond(`Added ${e.getName(uid)} to \`${args.group}\``);
    }
}

function groupLeave(e, args) {
    var uid = args.user ? args.user : e.userID;
    var sid = (args.where == "here" ? e.serverID : undefined);
    var result = e._disco.pm.addUserToGroup(uid, args.group, sid);
    if (result.success) {
        e.mention().respond(`Removed ${e.getName(uid)} from \`${args.group}\``);
    }
}

function groupCreate(e, args) {
        if (e._disco.pm.createGroup(args.group, args.where == "here" ? e.serverID : undefined)) {
            e.mention().respond(`Created group \`${args.group}\``);
            groupView(e, args);
        } else {
            e.mention().respond(`Failed to create group \`${args.group}\``);
        }

}

function groupRemove(e, args) {
    if (e._disco.pm.removeGroup(args.group, args.where == "here" ? e.serverID : undefined)) {
        e.mention().respond(`Removed group \`${args.group}\``);
        groupView(e, args);
    } else {
        e.mention().respond(`Failed to remove group \`${args.group}\``);
    }
}

function groupGrant(e, args) {
    if (e._disco.pm.groupGrant(args.permission, args.group, args.where == "here" ? e.serverID : undefined)) {
        e.mention().respond(`Granted \`${args.permission}\` to \`${args.group}\``);
        groupView(e, args);
    } else {
        e.mention().respond(`Failed to do that!`);
    }

}

function groupUnGrant(e, args) {
    if (e._disco.pm.groupUnGrant(args.permission, args.group, args.where == "here" ? e.serverID : undefined)) {
        e.mention().respond(`Removed \`${args.permission}\` from \`${args.group}\``);
        groupView(e, args);
    } else {
        e.mention().respond(`Failed to do that!`);
    }
}

function groupDeny(e, args) {
    if (e._disco.pm.groupDeny(args.permission, args.group, args.where == "here" ? e.serverID : undefined)) {
        e.mention().respond(`Denied \`${args.permission}\` to \`${args.group}\``);
        groupView(e, args);
    } else {
        e.mention().respond(`Failed to do that!`);
    }
}

function groupUnDeny(e, args) {
    if (e._disco.pm.groupUnDeny(args.permission, args.group, args.where == "here" ? e.serverID : undefined)) {
        e.mention().respond(`Removed deny \`${args.permission}\` from \`${args.group}\``);
        groupView(e, args);
    } else {
        e.mention().respond(`Failed to do that!`);
    }
}

function rights(e, args) {
    var subject = args[0] || e.userID;
    if (args[0]) e.text(`[Viewing ${e.getName(args.user)}'s permissions'] `);
    var str = "```\nYour permissions:\n";
    var groups = e._disco.pm.getUserGroups(subject, e.serverID);

    for (var gid in groups) {
        if (groups.hasOwnProperty(gid)) {
            str += "    Inherited from " + gid + "\n";
            str += "        " + groups[gid].permissions.join("\n        ") + "\n";
        }
    }

    str += "```";

    e.mention().respond(str);
}

function groupRoleList(e, args) {
    var roles = e.getRoles(null);

    var str = "";
    for (var rid in roles) {
      console.log(roles);
        if (roles.hasOwnProperty(rid)) {
            str += `${rid} as ${roles[rid].name.replace("@", "[at]")}\n`;
        }
    }

    e.mention().text("List of server roles:\n").code(str).respond();
}

function groupRoleAdd(e, args) {
        if (e._disco.pm.roleAdd(args.group, args.where == "here" ? e.serverID : undefined, args.role)) {
            e.mention().respond(`Linked \`${args.role}\` and \`${args.group}\``);
        } else {
            e.mention().respond("Failed to do that!");
        }
}

function groupRoleRemove(e, args) {
    if (e._disco.pm.roleAdd(args.group, args.where == "here" ? e.serverID : undefined, args.role)) {
        e.mention().respond(`Unlinked \`${args.role}\` and \`${args.group}\``);
    } else {
        e.mention().respond("Failed to do that!");
    }
}

function permissions(e, args) {

    if (args.command) {
      var id = args.command.trim();
      if (!e._disco.cm.commands[id]) {
          e.mention().respond("That command doesn't exist!");
          return;
      }
      var str = "```Listing permissions for command: " + id + "\n";
      var list = [];
      list.push(id + " - " + e._disco.cm.commands[id].permission);
      if(e._disco.cm.commands[id].child){
        for(var child in e._disco.cm.commands[id].child){
          list.push(id + " " + child + " - " + e._disco.cm.commands[id].child[child].permission);
        }

      }
      str += "\t" + list.join("\n\t") + "";

      str += "```";
      e.respond("Listing permission for command: " + str);
    } else {
        var str = "```Listing permissions on each plugin\n\n";
        for (var command in e._disco.cm.commands) {
            if (e._disco.cm.commands[command]) {
                str += `${command}\n`;
                var list = [];
                list.push(command + " - " + e._disco.cm.commands[command].permission);
                if(e._disco.cm.commands[command].child){
                  for(var child in e._disco.cm.commands[command].child){
                    list.push(command + " " + child + " - " + e._disco.cm.commands[command].child[child].permission);
                  }

                }
                str += "\t" + list.join("\n\t") + "\n\n";
            }
        }

        str += "```";
        e.respond(str);
    }
}

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Group admin",
        version: "1.1.0",
        author: "Zephy",
        description: "",
    },
    "group": {
        permission: "group",
        helpMessage: "N/A",
        category: "Admin",
        child: [{
                name: "view",
                handler: groupView,
                helpMessage: "List group members and permissions",
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: ["here"]
                    },
                    required: false
                }]
            }, // first subcommand
            {
                name: "rights",
                handler: rights,
                helpMessage: "See other's or your permissions",
                params: [{
                    id: "user",
                    type: "mention",
                    required: false
                }]
            },
            { name: "list", handler: groupList, helpMessage: "List all groups on this server." }, {
                name: "add",
                helpMessage: "Add someone to a group",
                handler: groupJoin,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "user",
                    type: "mention",
                    required: false
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    "required": false
                }]
            }, {
                name: "leave",
                helpMessage: "Remove someone from a group",
                handler: groupLeave,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "user",
                    type: "mention",
                    required: false
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }, {
                name: "create",
                helpMessage: "Create a group",
                handler: groupCreate,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }, {
                name: "remove",
                helpMessage: "Delete a group",
                handler: groupRemove,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }, {
                name: "grant",
                helpMessage: "Give a group permissions",
                handler: groupGrant,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "permission",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            },
            {
                name: "ungrant",
                helpMessage: "Remove permissions from a group",
                handler: groupUnGrant,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "permission",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }, {
                name: "deny",
                helpMessage: "Deny something for a group",
                handler: groupDeny,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "permission",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }, {
                name: "undeny",
                helpMessage: "Remove denies from a group",
                handler: groupUnDeny,
                params: [{
                    id: "group",
                    type: "string",
                    required: true
                }, {
                    id: "permission",
                    type: "string",
                    required: true
                }, {
                    id: "where",
                    type: "choice",
                    options: {
                        list: [
                            "here"
                        ]
                    },
                    required: false
                }]
            }
        ]
    },
    "link": {
        permission: "group",
        helpMessage: "N/A",
        category: "Admin",
        child: [{
            name: "list",
            helpMessage: "List server roles",
            handler: groupRoleList
        }, {
            name: "add",
            helpMessage: "Link a role to a group",
            handler: groupRoleAdd,
            params: [{
                id: "group", // bot group
                type: "string",
                required: true
            }, {
                id: "role", // server role
                type: "string",
                required: true
            }, {
                id: "where",
                type: "choice",
                options: {
                    list: [
                        "here"
                    ]
                },
                required: false
            }]
        }, {
            name: "remove",
            helpMessage: "Unlink a group from a role",
            handler: groupRoleRemove,
            params: [{
                id: "group",
                type: "string",
                required: true
            }, {
                id: "role",
                type: "string",
                required: true
            }, {
                id: "where",
                type: "choice",
                options: {
                    list: [
                        "here"
                    ]
                },
                required: false
            }]
        }, ]
    },
    "permissions": {
        permission: "permissions",
        helpMessage: "List permissions required to run a command",
        category: "uncathegorized",
        handler: permissions,
        params: [{
            id: "command",
            type: "string",
            required: false
        }]
    }
};
