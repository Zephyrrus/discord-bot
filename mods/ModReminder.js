var databaseStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "userID", type: "string", required: true, unique: true },
    { name: "message", type: "string" },
    { name: "time", type: "datetime", required: true },
    { name: "private", type: "bool", required: true },
    { name: "reminded", type: "bool", required: true }
];
var database = new(require("../core/Database/databaseHandler.js"))('reminders', databaseStructure);
var parser = require('moment-parser');
var reminderFromString = /[^;%$\|]*/;
var uidFromMention = /<@([0-9]+)>/;

var reminderInstance;

var cachedAlarms = {};

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Reminder module",
        version: "1.2.1",
        author: "Zephy",
        description: "reminds you about something in xhxmxs",
        setup: cacheRemind
    },
    "remind": {
        permission: "remind",
        helpMessage: "set a reminder. Time format can be natural language (10 minutes and 5 seconds) or xHxMxS format.",
        category: "Misc",
        handler: doRemind,
        params: [{
            id: "flags",
            type: "flags",
            options: {
                list: [
                    "pm"
                ],
                opts: {
                    boolean: true
                }
            }
        }],
        child: [{
            name: "list",
            handler: checkReminders,
            helpMessage: "does magic"
        }]
    }
};

function doRemind(e, args) {
    var pm = args.flags.pm || false;
    //e.respond("State of PM flag: " + pm);
    var joinedArguments = args._str;
    var reminder = reminderFromString.exec(joinedArguments)[0];
    var split = [reminder, joinedArguments.substring(reminder.length + 1)];
    split[0] = split[0].trim();
    if (split[0] === "" || split[1] === "") {
        e.mention().respond("Missing time variable or message to remind you about\n**Usage**: \nremind <time> [separator] <message> - Will remind you in x about <message>\nAny of the following characters can be used as a separator: **;%$|**");
        return;
    }
    try {
        var parsedTimeTemp = parser.parseDuration(split[0]);
        e.mention().code(JSON.stringify(parsedTimeTemp), 'javascript').respond();
    } catch (error) {
        var parseUglyValue = parseUgly(split[0]);
        e.mention().code(JSON.stringify(parseUglyValue, null, '\t'), 'javascript').respond();
    }

    /*try {
      var parsedTimeTemp = parser.parseDuration(split[0]);
      e._disco.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> I will remind you about `" + split[1] + "` in **" + split[0] + "**" + "\nDBG```javascript\n" + JSON.stringify(parsedTimeTemp) + "```"
      });
      setTimeout(function () {
        e._disco.bot.sendMessage({
          to: e.channelID,
          message: "Hey <@" + e.userID + ">!\n**You told me to remind you about** ```" + split[1] + "```" + split[0] + " ago"
        });
      }, parsedTimeTemp._milliseconds);
    } catch (error) {
      var parseUglyValue = parseUgly(split[0]);
      if(parseUglyValue) {
        e._disco.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> I will remind you about `" + split[1] + "` in **" + split[0] + "**\nDBG:```javascript\n" + JSON.stringify(parseUglyValue, null, '\t') + "```"
        });
        setTimeout(function () {
          e._disco.bot.sendMessage({
            to: e.channelID,
            message: "Hey <@" + e.userID + ">!\n**You told me to remind you about** ```" + split[1] + "```" + split[0] + " ago"
          });
        }, parseUglyValue.absolute);
      }else{
      e._disco.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> First and second pass parsing of time failed. Are you sure that it's a correct time ?"
      });
    }
  }*/
}

var parseUgly = function (timeout) {
    var hours = 0;
    var minutes = 0;
    var seconds = 0;
    var days = 0;
    var years = 0;
    timeout = timeout.replace(/\s+/g, '');
    if (timeout.toLowerCase().split("y").length >= 2) {
        years = parseInt(timeout.toLowerCase().split("y")[0]);
        timeout = timeout.toLowerCase().split("y")[1];
    }
    if (timeout.toLowerCase().split("d").length >= 2) {
        days = parseInt(timeout.toLowerCase().split("d")[0]);
        timeout = timeout.toLowerCase().split("d")[1];
    }
    if (timeout.toLowerCase().split("h").length >= 2) {
        hours = parseInt(timeout.toLowerCase().split("h")[0]);
        timeout = timeout.toLowerCase().split("h")[1];
    }
    if (timeout.toLowerCase().split("m").length >= 2) {
        minutes = parseInt(timeout.toLowerCase().split("m")[0]);
        timeout = timeout.toLowerCase().split("m")[1];
    }
    if (timeout.toLowerCase().split("s").length >= 2) {
        seconds = parseInt(timeout.toLowerCase().split("s")[0]);
    }
    var absolute = (((hours * 60 * 60) + (minutes * 60) + seconds) * 1000);
    if (isNaN((hours + minutes + seconds)) || absolute < 1) return false;
    return {
        absolute: new Date().getTime() + (((hours * 60 * 60) + (minutes * 60) + seconds) * 1000),
        relative: (((hours * 60 * 60) + (minutes * 60) + seconds) * 1000),
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        days: days,
        years: years
    };
};

function cacheRemind() {
    database.find({ "time": new Date(Date.now() + (86400 * 1000)), "reminded": "0" }, { "time": "<" }, function (err, res) {
        console.log(err);
        console.log(res);
    });
}

function doReminder() {

}

function storeReminder(e, args, time, message) {
    //insert into database and cache it

}

function tickReminders() {
    //tick them every 5 seconds, if one of them goes smaller than 5, remind it.

}

function checkReminders(e, args) {
    var str = "Your reminders: \n";
    database.find({ /*"userID": e.userID,*/ "reminded": "0" }, function (err, res) {
        if (err) { console.log(err);
            return (e.mention.respond("Failed database querry.")); }
        if (res.count === 0) return (e.mention.respond("You don't have any upcoming reminders."));
        for (var i = 0; i < res.count; i++) {
            str += "**" + res.result[i].message + "**" + (res.result[i].private === 1 ? " *[PM]*" : "") + "\n\t" + new Date(parseInt(res.result[i].time)) + "\n";
        }
        e.mention().respond(str);
    });
}

/*
 * Time to throw my plan here if I still remember it.
 * First we cache the reminders for the next 24h, then every hour we do a caching again to check if there is anything new
 * If a reminder is already in cache, don't add it agian.
 * Every reminder has a varaible timeout which has a setTimeout tied to it.
 * Every new reminder is added to the cache (if it's not more than 24h), and also to the database.
 * When a reminder is finished, mark it like that in the databse then throw it away from the cache
 * The reminder also stores the channelID, if the PM flag was set to true, it will remind you in pm instead
 *
 * TODO: Expose the reminders to the web module.
 */
