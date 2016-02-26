var logger = require("winston");
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
}


CommandRegister.prototype.addModule = function (moduleObject) {
  for (var i = 0; i < Object.keys(moduleObject).length; i++) { // TODO: push author, moduleName, description, version, databaseStructure, helpMessage to the object after checking if they're not undefined
    var command = {};
    if (typeof moduleObject[Object.keys(moduleObject)[i]] !== 'object') {
      logger.error(`[CMD]_Malformed object received. DBG: ` + JSON.stringify(moduleObject, null, "\t"));
      continue;
    }

    var currentKey = moduleObject[Object.keys(moduleObject)[i]];
    currentKey.name = Object.keys(moduleObject)[i];
    if(this.commands[currentKey.name]){
      logger.error(`[CMD]_Duplicate command received from '${currentKey.moduleName}'.`);
      return;
    }
    if (!currentKey.permission) {
      logger.error(`[CMD]_Malformed main command received from '${currentKey.moduleName}'.`);
      return;
    }
    if (!currentKey.description || !currentKey.author || !currentKey.moduleName) {
      logger.warn(`[CMD]_Module '${currentKey.name}' is missing important identifiers from it's header.`);
    }
    command.description = currentKey.description || "N/A";
    command.author = currentKey.author || "N/A";
    command.version = currentKey.version || "N/A"
    if (currentKey.child && !(currentKey.child instanceof Array)) {
      logger.error(`[CMD]_Malformed command header received from '${currentKey.moduleName}'.`);
      return;
    }
    if (!currentKey.handler) {
      if (!currentKey.child || !(currentKey.child instanceof Array)) {
        logger.error(`[CMD]_Module '${currentKey.moduleName}' has no handlers declared.`);
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
            command['child'][currentKey.child[i].name] = { handler: currentKey.child[i].handler, permission: currentKey.child[i].permission, helpMessage: currentKey.child[i].helpMessage}
            logger.info(`[CMD]_Loaded '${currentKey.name}.${currentKey.child[i].name}'.`)

          } else {
            logger.warn(`[CMD]_Command '${currentKey.name}.${currentKey.child[i].name}' handler is not a function, ignoring child command.`);
          }
        }

      }
    }
    this.commands[currentKey.name] = command;
  }
}

CommandRegister.prototype.tryExec = function (e, cmd, arguments, callback) {
  if (!this.commands[cmd]) {
    return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
  }
  if (this.commands[cmd].child) {
    //add perm check
    if (this.commands[cmd]['child'][arguments[0]]) {
      var subcmd = arguments.shift(); // murder the sub command now
      logger.debug("[CMD]_Found child command for " + cmd + "." + subcmd);
      this.commands[cmd]['child'][subcmd].handler(arguments, e) // call the subcommands
      return (callback && callback(null));
    } else {
      logger.debug("[CMD]_No child command with that arg " + cmd + "." + arguments[0] + ", executing parent command");
      if (this.commands[cmd].handler) this.commands[cmd].handler(arguments, e);
    }
  } else {
    logger.debug("[CMD]_No child commands for " + cmd + ", executing parent command");
    if (this.commands[cmd].handler) this.commands[cmd].handler(arguments, e);
  }
}

CommandRegister.prototype.getHelpModule = function (cmd) {
  var help = [];
  if (!this.commands[cmd]) {
    return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
  }
  help.push(cmd + " " + (this.commands[cmd].helpMessage || "No help defined."))
  if(this.commands[cmd].child){
    for(var i = 0; i < this.commands[cmd].child.count; i++){
      help.push(cmd + " " + this.commands[cmd].child[i].name + " " + (this.commands[cmd].child[i].helpMessage || "No help defined."));
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

CommandRegister.prototype.getAllModules = function () {
  return (Object.keys(this.commands));
}

module.exports = CommandRegister;
