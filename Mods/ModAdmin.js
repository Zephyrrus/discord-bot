module.exports = {
    "MODULE_HEADER": {
        moduleName: "Admin module",
        version: "1.2.0",
        author: "Zephy",
        description: "Admin commands.",
    },
    "game": {
        permission: "admin",
        helpMessage: "Sets the bot's currently playing indicator.",
        category: "Admin",
        handler: setStatus,
    }
}


function setStatus(e, args) {
  e._disco.setStatus(args._str);
  e.mention().respond("changed status to: *" + args._str + "*")
}
