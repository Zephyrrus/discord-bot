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
    },
    "lewd": {
        helpMessage: "Enabled NSFW in the current channel.",
        category: "Admin",
        handler: setLewd,
        params: [{
            id: "nsfw",
            type: "boolean",
            required: true
        }]
    }
};


function setStatus(e, args) {
    e._disco.setStatus(args._str);
    e.mention().respond("changed status to: *" + args._str + "*");
}

function setLewd(e, args) {
    if (args.nsfw) {
        if (e.database.nsfwChannels.indexOf(e.channelID) > -1) {
            e.mention().respond("I am already *lewd*  in this channel \uD83D\uDE33");
            return;
        }
        e.database.nsfwChannels.push(e.channelID);
        e.database.saveConfig("nsfwChannels");
        e.mention().respond("From now on I will be lewd in this channel. \uD83D\uDE33");
        return;
    }else{
      if (e.database.nsfwChannels.indexOf(e.channelID) == -1) {
          e.mention().respond("I was never being lewd in this channel. \uD83D\uDE22");
          return;
      }
      e.database.nsfwChannels.splice(e.database.nsfwChannels.indexOf(e.channelID), 1);
      e.database.saveConfig("nsfwChannels");
      e.mention().respond("I will stop being lewd here, I am sorry \uD83D\uDE22");
      return;
    }


}
