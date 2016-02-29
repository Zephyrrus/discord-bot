var logger = require("winston");
var utils = require("./Utils.js");
var config = require("../configs/config.json");
//TODO: separate this into a module loader and command register. Module loader will load an object called "MODULE" which will be a special keyword and can't be used as command name

var example = {
  "kitten": { // main command
    handler: "doKitten", // main function (can be undefined if it has child commands)
    permission: "kitten", // permission to use main function (will be unused later, perm will be derived from command name)
    description: "random kitten poster", // module description
    author: "Zephy", // author
    version: "1.1.0", // version
    moduleName: "Kitten poster", // module name to show up nicer in loaded  modules
    databaseStructure: "databaseStructure", // gud ol database structure
    helpMessage: "Test",
    child: [ // subcommands
      { name: "add", handler: "addNightcore", permission: "add", helpMessage: "<youtubeID> - add a youtube shit to the db" }, // first subcommand
      { name: "list", handler: "listNightcores", permission: "list", helpMessage: "<youtubeID> - creates a playlist of the shits" } // second subcommand
    ]
  }
}

function CommandRegister() {
  this.commands = {};
  this.cooldowns = [];
  this.modules = {};
}


CommandRegister.prototype.addModule = function (moduleObject) {
  var moduleIdentifier;
  if (!moduleObject["MODULE_HEADER"]){
    logger.error("[CMD]_This module has no MODULE_HEADER definined, ignoring. (Keys in this module: " +Object.keys(moduleObject) +") ");
    return;
  }
  for (var i = 0; i < Object.keys(moduleObject).length; i++) { // TODO: push author, moduleName, description, version, databaseStructure, helpMessage to the object after checking if they're not undefined
    if(Object.keys(moduleObject)[i] === "MODULE_HEADER"){
      if(moduleIdentifier) {
        logger.warn(`[CMD]_Duplicate module header received from '${currentKey.moduleName}', ignoring.`);
        continue;
      }
      var currentKey = moduleObject["MODULE_HEADER"];
      var abbreviation = utils.abbreviate(currentKey.moduleName, Object.keys(this.modules));
      this.modules[abbreviation] = currentKey;
      moduleIdentifier = abbreviation;
      continue; // this was the special keyword, continue.
    }

    var command = {};
    if (typeof moduleObject[Object.keys(moduleObject)[i]] !== 'object') {
      try{
        logger.error(`[CMD]_Malformed object received. DBG: ` + JSON.stringify(moduleObject, null, "\t"));
      } catch(e){
        logger.error("[CMD]_Malformed object received, JSON parse failed " + e + ". Header: " + moduleObject);
      }
      continue;
    }

    var currentKey = moduleObject[Object.keys(moduleObject)[i]];
    currentKey.name = Object.keys(moduleObject)[i];
    if(this.commands[currentKey.name]){
      logger.error(`[CMD]_Duplicate command received from '${currentKey.name}'.`);
      return;
    }
    if (!currentKey.permission) {
      logger.error(`[CMD]_Command has no permissions defined! '${currentKey.name}'.`);
      return;
    }
    if (!currentKey.helpMessage || !currentKey.category) {
      logger.warn(`[CMD]_Command '${currentKey.name}' is missing important identifiers from it's header.`);
    }

    command.description = currentKey.description || "N/A"; // used to describe what this command of the module does
    command.helpMessage = currentKey.helpMessage || "N/A";
    command.moduleID = moduleIdentifier;
    command.cooldown = currentKey.cooldown || config.general.globalcooldown;
    command.category = currentKey.category || "uncategorized";

    if (currentKey.child && !(currentKey.child instanceof Array)) {
      logger.error(`[CMD]_Malformed command header received from '${currentKey.name}'.`);
      return;
    }
    if (!currentKey.handler) {
      if (!currentKey.child || !(currentKey.child instanceof Array)) {
        logger.error(`[CMD]_Module '${currentKey.name}' has no handlers declared.`);
        return;
      }
    }
    if (currentKey.handler && typeof currentKey.handler === 'function') {
      logger.info(`[CMD]_Loaded '${currentKey.name}'.`)
      command['handler'] = currentKey.handler;
    }
    if (currentKey.child){
      command['child'] = [];
      for (var i = 0; i < currentKey.child.length; i++) {
        if (currentKey.child[i].handler) {
          if (typeof currentKey.child[i].handler === 'function' && currentKey.child[i].name) {
            if(command['child'][currentKey.child[i].name]){
              logger.warn(`[CMD]_Child with '${currentKey.name}.${currentKey.child[i].name}' already exists.`)
              continue;
            }
            command['child'][currentKey.child[i].name] = { handler: currentKey.child[i].handler, permission: currentKey.permission + "." + currentKey.child[i].name, helpMessage: currentKey.child[i].helpMessage, cooldown: currentKey.child[i].helpMessage || config.general.globalcooldown}
            logger.info(`[CMD]_Loaded '${currentKey.name}.${currentKey.child[i].name}'.`)

          } else {
            logger.warn(`[CMD]_Command '${currentKey.name}.${currentKey.child[i].name}' handler is not a function, ignoring child command.`);
          }
        }

      }
    }
    //TODO: handle aliases
    this.commands[currentKey.name] = command;

  }
}

CommandRegister.prototype.tryExec = function (e, cmd, arguments, callback) {
  //handle cooldown
  if(arguments[0]) arguments[0].toLowerCase();
  if (!this.commands[cmd]) {
    return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
  }
  if (this.commands[cmd].child && arguments[0]) {
    //add perm check
    var lowerSubcmd = arguments[0] ? arguments[0].toLowerCase() : arguments[0];
    if (this.commands[cmd]['child'][lowerSubcmd]) {
      var subcmd = arguments.shift(); // murder the sub command now
      logger.debug("[CMD]_Found child command for " + cmd + "." + subcmd);
      this.commands[cmd]['child'][subcmd].handler(arguments, e) // call the subcommands
      return (callback && callback(null));
    } else {
      logger.debug("[CMD]_No child command with that arg " + cmd + "." + arguments[0] + ", executing parent command");
      if (this.commands[cmd].handler) this.commands[cmd].handler(arguments, e);
    }
  } else {
    logger.debug("[CMD]_No child commands for " + cmd + ", executing parent command or no subcmd received.");
    if (this.commands[cmd].handler) this.commands[cmd].handler(arguments, e);
  }
}

CommandRegister.prototype.getHelpCommand = function (cmd) {
  var help = {};
  if (!this.commands[cmd]) {
    return "Command does not exist";
  }
  help.parent = {command: cmd, help: this.commands[cmd].helpMessage}
  help.category = this.commands[cmd].category;
  help.moduleID = this.commands[cmd].moduleID;
  if(this.commands[cmd].child){
    help.child = [];
    for(var i = 0; i < Object.keys(this.commands[cmd].child).length; i++){
      var currentChild = this.commands[cmd].child[Object.keys(this.commands[cmd].child)[i]];
      help.child.push({command: Object.keys(this.commands[cmd].child)[i], help: currentChild.helpMessage});
    }
  }
  return help;
}

CommandRegister.prototype.getHelpPermission = function (uid) {
  var help = [];
  if (!this.commands[cmd]) {
    return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
  }

}

CommandRegister.prototype.getPermission = function (cmd, arguments, cb) {

}

CommandRegister.prototype.getAllCommands = function () {
  return (Object.keys(this.commands));
}

module.exports = CommandRegister;
