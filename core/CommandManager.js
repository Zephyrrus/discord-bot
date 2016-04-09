var logger = require("winston");
var utils = require("./Utils.js");
var config = require("../configs/config.json");
var ParameterParser = require("./ArgumentObject.js");
var fs = require('fs');
var path = require('path');

function CommandRegister(disco) {
    this.commands = {};
    this.cooldowns = [];
    this.modules = {};
    this.disco = disco;
}


CommandRegister.prototype.addModule = function (moduleObject) {
    var moduleIdentifier;
    if (!moduleObject.MODULE_HEADER) {
        logger.error("[CMD]: This module has no MODULE_HEADER definined, ignoring. (Keys in this module: " + Object.keys(moduleObject) + ") ");
        return;
    }
    for (var i = 0; i < Object.keys(moduleObject).length; i++) {
        var currentKey;
        if (Object.keys(moduleObject)[i] === "MODULE_HEADER") {
            if (moduleIdentifier) {
                logger.warn(`[CMD]: Duplicate module header received from '${currentKey.moduleName}', ignoring.`);
                continue;
            }
            if (Object.keys(moduleObject)[i].charAt(0) == '_') continue;
            currentKey = moduleObject.MODULE_HEADER;
            var abbreviation = utils.abbreviate(currentKey.moduleName, Object.keys(this.modules));
            this.modules[abbreviation] = currentKey;
            moduleIdentifier = abbreviation;
            if (currentKey.setup && typeof (currentKey.setup == "function")) {
                try {
                    currentKey.setup(this.disco);
                    logger.debug(`[CMD]: Module '${currentKey.moduleName}' had setup defined. Executed.`);
                } catch (exp) {
                    logger.error(`[CMD]: Module '${currentKey.moduleName}' had setup defined. Tried to execute but failed. Expection:\n ${exp.stack}`);
                }
            }
            continue; // this was the special keyword, continue.
        }

        var command = {};

        if (typeof moduleObject[Object.keys(moduleObject)[i]] !== 'object') {
            try {
                logger.error(`[CMD]: Malformed object received. DBG: ` + JSON.stringify(moduleObject, null, "\t"));
            } catch (e) {
                logger.error("[CMD]: Malformed object received, JSON parse failed " + e + ". Header: " + moduleObject);
            }
            continue;
        }

        currentKey = moduleObject[Object.keys(moduleObject)[i]];
        currentKey.name = Object.keys(moduleObject)[i];

        if (this.commands[currentKey.name]) {
            logger.error(`[CMD]: Duplicate command received from '${currentKey.name}'.`);
            return;
        }

        if (!currentKey.permission) {
            command.permission = currentKey.name + ".main";
        } else {
            if (currentKey.permission.indexOf(".") > -1) {
                command.permission = currentKey.permission;
            }else{
                command.permission = currentKey.permission + ".main";
            }
        }


        if (!currentKey.helpMessage || !currentKey.category) {
            logger.warn(`[CMD]: Command '${currentKey.name}' is missing important identifiers from it's header. (` + ((currentKey.helpMessage ? "" : "helpMessage,") + (currentKey.category ? "" : "category")) + `)`);
        }

        if (currentKey.params && !(currentKey.params instanceof Array)) {
            logger.error(`[CMD]: Command '${currentKey.name}' has incorrect params, skipping loading of current module.`);
            return;
        }

        command.description = currentKey.description || "N/A"; // used to describe what this command of the module does
        command.helpMessage = currentKey.helpMessage || "N/A";
        command.moduleID = moduleIdentifier;
        command.cooldown = currentKey.cooldown || config.general.globalcooldown;
        command.category = currentKey.category || "uncategorized";
        command.params = currentKey.category || undefined;
        command.paramParser = new ParameterParser.Params(currentKey.params, this.disco);

        if (currentKey.child && !(currentKey.child instanceof Array)) {
            logger.error(`[CMD]: Malformed command header received from '${currentKey.name}'.`);
            return;
        }
        if (!currentKey.handler) {
            if (!currentKey.child || !(currentKey.child instanceof Array)) {
                logger.error(`[CMD]: Command '${currentKey.name}' has no handlers declared.`);
                return;
            }
        }
        if (currentKey.handler && typeof currentKey.handler === 'function') {
            logger.debug(`[CMD]: Loaded '${currentKey.name}' [permission: ${command.permission}]`);
            command.handler = currentKey.handler;
        }
        if (currentKey.child) {

            command.child = {};

            for (var j = 0; j < currentKey.child.length; j++) {

                if (currentKey.child[j].handler) {
                    if (typeof currentKey.child[j].handler === 'function' && currentKey.child[j].name) {
                        if (command.child[currentKey.child[j].name]) {
                            logger.warn(`[CMD]: Child with '${currentKey.name}.${currentKey.child[j].name}' already exists.`);
                            continue;
                        }
                        var permission = currentKey.child[j].permission ? currentKey.child[j].permission : currentKey.permission + "." + currentKey.child[j].name; // if you want custom permission, otherwise I will derivate it from parent permission.child name
                        if (currentKey.child[j].params && !(currentKey.child[j].params instanceof Array)) {
                            logger.error(`[CMD]: Command '${currentKey.name}.${currentKey.child[j].name}' has incorrect params, skipping loading of current module.`);
                            return;
                        }
                        var paramParser = new ParameterParser.Params(currentKey.child[j].params, this.disco);
                        command.child[currentKey.child[j].name] = { handler: currentKey.child[j].handler, permission: permission, helpMessage: currentKey.child[j].helpMessage, cooldown: currentKey.child[j].helpMessage || config.general.globalcooldown, params: currentKey.child[j].params || undefined, paramParser: paramParser };
                        logger.debug(`[CMD]: Loaded '${currentKey.name}.${currentKey.child[j].name}' [permission: ${permission}].`);
                    } else {
                        logger.warn(`[CMD]: Command '${currentKey.name}.${currentKey.child[j].name}' handler is not a function, ignoring child command.`);
                    }
                } else {
                    logger.warn(`[CMD]: Command '${currentKey.name}.${currentKey.child[j].name}' has no handler defined.`);
                }

            }
        }
        //TODO: handle aliases
        this.commands[currentKey.name] = command;
    }
};

CommandRegister.prototype.tryExec = function (e, cmd, args, callback) {
    try {
        if (args[0]) args[0].toLowerCase();

        if (!this.commands[cmd]) {
            return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
        }
        var parameters;
        if (this.commands[cmd].child && args[0]) {
            var lowerSubcmd = args[0] ? args[0].toLowerCase() : args[0];

            if (this.commands[cmd].child[lowerSubcmd]) {
                var subcmd = args.shift(); // murder the sub command now
                logger.debug("[CMD]_Found child command for " + cmd + "." + subcmd);
                if (this.checkCooldown(cmd + "-" + subcmd, this.commands[cmd].cooldown, e.userID)) {
                    parameters = this.commands[cmd].child[subcmd].paramParser.get(args.join(" "));
                    if (parameters && !parameters.error) {
                        if (this.canRun(e, this.commands[cmd].child[subcmd].permission) && this.commands[cmd].child[subcmd].handler) this.commands[cmd].child[subcmd].handler(e, parameters.results);
                        return (callback && callback(null));
                    } else {
                        return (callback && callback({ errorcode: 2, error: { usage: `Usage: ${cmd} ${subcmd} ${this.commands[cmd].child[subcmd].paramParser.getHelp()}`, message: parameters.error.message } }));
                    }
                } else {
                    return (callback && callback({ errorcode: 1, error: "User can not run this command because it's on cooldown." /*, retryAfter: cd.retryAfter */ }));
                }
            } else {
                logger.debug("[CMD]_No child command with that arg " + cmd + "." + args[0] + ", executing parent command");
                if (this.checkCooldown(cmd, this.commands[cmd].cooldown, e.userID)) {
                    parameters = this.commands[cmd].paramParser.get(args.join(" "));

                    if (parameters && !parameters.error) {
                        if (this.canRun(e, this.commands[cmd].permission) && this.commands[cmd].handler) this.commands[cmd].handler(e, parameters.results);
                        return (callback && callback(null));
                    } else {
                        return (callback && callback({ errorcode: 2, error: { usage: `Usage: ${cmd} ${this.commands[cmd].paramParser.getHelp()}`, message: parameters.error.message } }));
                    }
                } else {
                    return (callback && callback({ errorcode: 1, error: "User can not run this command because it's on cooldown." /*, retryAfter: cd.retryAfter */ }));
                }
            }
        } else {
            logger.debug("[CMD]_No child commands for " + cmd + ", executing parent command or no subcmd received.");
            if (this.checkCooldown(cmd, this.commands[cmd].cooldown, e.userID)) {
                parameters = this.commands[cmd].paramParser.get(args.join(" "));
                if (parameters && !parameters.error) {
                    e.args = parameters;
                    if (this.canRun(e, this.commands[cmd].permission) && this.commands[cmd].handler) this.commands[cmd].handler(e, parameters.results);
                    return (callback && callback(null));
                } else {
                    return (callback && callback({ errorcode: 2, error: { usage: `Usage: ${cmd} ${this.commands[cmd].paramParser.getHelp()}`, message: parameters.error.message } }));
                }
            } else {
                return (callback && callback({ errorcode: 1, error: "User can not run this command because it's on cooldown." /*, retryAfter: cd.retryAfter */ }));
            }
        }
    } catch (err) {
        return (callback && callback({ errorcode: -1, error: "Failed executing command", stack: err.stack /*, retryAfter: cd.retryAfter */ }));
    }
};

CommandRegister.prototype.getHelpCommand = function (cmd) {
    var help = {};
    if (!this.commands[cmd]) {
        return "Command does not exist";
    }
    help.parent = { command: cmd, help: this.commands[cmd].helpMessage, arguments: this.commands[cmd].paramParser.getHelp() };
    help.category = this.commands[cmd].category;
    help.moduleID = this.commands[cmd].moduleID;
    if (this.commands[cmd].child) {
        help.child = [];
        for (var i = 0; i < Object.keys(this.commands[cmd].child).length; i++) {
            var currentChild = this.commands[cmd].child[Object.keys(this.commands[cmd].child)[i]];
            help.child.push({ command: Object.keys(this.commands[cmd].child)[i], arguments: currentChild.paramParser.getHelp(), help: currentChild.helpMessage });
        }
    }
    return help;
};

CommandRegister.prototype.getHelpPermission = function (cmd, uid, sid) {
    var help = {};
    if (!this.commands[cmd]) {
        return "Command does not exist";
    }
    if (this.disco.pm.canUser(uid, this.commands[cmd].permission, sid)) {
        help.parent = { command: cmd, help: this.commands[cmd].helpMessage, arguments: this.commands[cmd].paramParser.getHelp() };
        help.category = this.commands[cmd].category;
        help.moduleID = this.commands[cmd].moduleID;
        if (this.commands[cmd].child) {
            help.child = [];
            for (var i = 0; i < Object.keys(this.commands[cmd].child).length; i++) {
                var currentChild = this.commands[cmd].child[Object.keys(this.commands[cmd].child)[i]];
                if (this.disco.pm.canUser(uid, currentChild.permission, sid)) {
                    help.child.push({ command: Object.keys(this.commands[cmd].child)[i], arguments: currentChild.paramParser.getHelp(), help: currentChild.helpMessage });
                }
            }
        }
        return help;
    }
    return false;
};

CommandRegister.prototype.setCooldown = function (cmd, uid) {
    //youtube-fetch for child commands
    this.cooldowns[uid] = [];
    this.cooldowns[uid][cmd] = { executed: new Date().getTime() };
};

CommandRegister.prototype.checkCooldown = function (cmd, cooldown, uid) {
    var requestTime = new Date().getTime();
    if (this.cooldowns[uid] && this.cooldowns[uid][cmd]) {
        if (this.cooldowns[uid][cmd].executed + cooldown < requestTime) {
            this.setCooldown(cmd, uid);
            return true;
        } else {
            return false;
        }
    }
    this.setCooldown(cmd, uid);
    return true;
};

CommandRegister.prototype.canRun = function (e, permission) {
    if (!this.disco.pm.canUser(e.userID, permission, e.serverID)) {
        logger.info("This user can't run this command");
        e.mention().respond(" You can't run this command!");
        return false;
    }
    return true;
};

CommandRegister.prototype.load = function () {
    var self = this;
    fs.readdir(config.core.pluginsFolder, function (err, filenames) {
        if (err) {
            logger.error("[LOAD]:" + err);
            onError(err);
            return;
        }

        for (var i = 0; i < filenames.length; i++) {
            if (path.extname(filenames[i]) === '.js') {
                try {
                    self.addModule(require("../" + config.core.pluginsFolder + "/" + filenames[i]));
                } catch (e) {
                    logger.error("[LOAD]: Failed loading file: " + filenames[i] + "\n" + e.stack);
                }
            }
        }

    });
};

module.exports = CommandRegister;
