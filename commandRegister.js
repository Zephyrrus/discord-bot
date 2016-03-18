var logger = require("winston");


function commandRegister() {
  this.commands = {};
  this.cooldowns = [];
}


commandRegister.prototype.addModule = function (moduleObject) {
  var cmds = {};
  for (var i = 0; i < Object.keys(moduleObject).length; i++) { // TODO: push author, moduleName, description, version to the object after checking if they're not undefined
    if(typeof moduleObject[Object.keys(moduleObject)[i]] !== 'object'){
      logger.error(`[CMD]_Malformed object received. DBG: ` + JSON.stringify(moduleObject, null, "\t"));
      continue;
    }
    var currentKey = moduleObject[Object.keys(moduleObject)[i]];
    currentKey.name = Object.keys(moduleObject)[i]
    if (!currentKey.permission) {
      logger.error(`[CMD]_Malformed main command received from '${currentKey.moduleName}'.`);
      return;
    }
    if (!currentKey.description || !currentKey.author || !currentKey.moduleName) {
      logger.warn(`[CMD]_Module '${currentKey.name}' is missing important identifiers from it's header.`);
    }
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
    if (currentKey.handler) {
      logger.info(`[CMD]_Loaded '${currentKey.name}'.`)
      cmds['handler'] = currentKey.handler;
    }
    if (currentKey.child)
      for (var i = 0; i < currentKey.child.length; i++) {
        if (currentKey.child[i].handler) {
          if (typeof currentKey.child[i].handler === 'function') {
            cmds['child'][currentKey.child[i].name] = { handler: currentKey.child[i].handler, permission: currentKey.child[i].permission, description: currentKey.child[i].description }
            logger.info(`[CMD]_Loaded '${currentKey.name}.${currentKey.child[i].name}'.`)

          } else {
            logger.warn(`[CMD]_Command '${currentKey.name}.${currentKey.child[i].name}' handler is not a function, ignoring child command.`);
          }
        }

      }
    this.commands[currentKey.name] = cmds;
  }
}

commandRegister.prototype.tryExec = function (e, cmd, arguments, callback) {
  console.log(JSON.stringify(this.commands));
  if (!this.commands[cmd]) {
    return (callback && callback({ errorcode: 404, error: "Command does not exist" }));
  }
  if (this.commands[cmd].child) {
    //add perm check
    if (this.commands[cmd][child][arguments[0]]) {
      logger.debug("Found child command for " + cmd + "." + arguments[0]);
      args.shift(); // murder the sub command now
      this.commands[cmd][child][arguments[0]].handler(e, args) // call the subcommands
      return (callback && callback(null));
    } else {
      logger.debug("No child command with that arg " + cmd + "." + arguments[0] + ", executing parent command");
      if (this.commands[cmd].handler) this.commands[cmd].handler(e, args);
    }
  } else {
    logger.debug("No child commands for" + cmd + ", executing parent command");
    if (this.commands[cmd].handler) this.commands[cmd].handler(arguments, e);
  }
}


commandRegister.prototype.getPermission = function (cmd, arguments, cb) {

}

module.exports = commandRegister;
