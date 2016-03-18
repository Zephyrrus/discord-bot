module.exports = {
    "MODULE_HEADER": {
        moduleName: "Core commands",
        version: "1.3.0",
        author: "Zephy",
        description: "Core commands",
    },
    "ping": {
        permission: "ping",
        helpMessage: "pong!",
        category: "Info",
        handler: ping,
    },
    "id": {
        permission: "id",
        helpMessage: "hows the id of the requested channel/user/etc",
        category: "Info",
        handler: getID,
        params: [{
            id: "param",
            type: "string",
            required: false
        }]
    },
    "echo":{
      helpMessage: "the bot will repeat your message.",
      category: "Misc",
      handler: echo,
      child: [
          { name: "-h", handler: echoH, helpMessage: "the bot will repeat your message (without mentioning you)", permission: "echo.hide" },
      ]
    }
}

function ping(e, args) {
    var _delay;
    e.mention().respond("Pong!", function (err, res) {
        if (err) return;
        _delay = new Date(res.timestamp).getTime() - new Date(e.rawEvent.d.timestamp).getTime();
        e._disco.bot.editMessage({
            channel: res.channel_id,
            messageID: res.id,
            message: "<@" + e.userID + "> Pong\nNetwork delay: **" + _delay + "** ms"
        })
    });
}

function getID(e, args) {
    if (args.param) {
        if (args.param.toLowerCase() == "channel") {
            sendMessages(e, ["The ID of this channel is `" + e.channelID + "`"]);
        } else if (args.param.toLowerCase() == "server") {
            e.respond("Server ID => `" + e.bot.serverFromChannel(e.channelID) + "`")
        } else if (args.param.indexOf("<@") > -1 && args.param.indexOf(">") > -1) {
            e.respond(args.param + " => `" + args.param.substring(2, args.param.length - 1) + "`")
        } else {
            e.mention().respond("=> `@" + e.userID + "`")
        }
    } else {
        e.mention().respond("=> `@" + e.userID + "`");
    }
}

function echo(e, args){
  e.deleteMessage();
  e.respond(args._str + " [<@" + e.userID + ">]");
}

function echoH(e, args){
  e.deleteMessage();
  e.respond(args._str);
}
