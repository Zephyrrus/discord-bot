var databaseStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "addedOn", type: "string", required: true },
    { name: "channelID", type: "string", required: true },
    { name: "userID", type: "string", required: true },
    { name: "message", type: "string" },
    { name: "time", type: "datetime", required: true },
    { name: "relative", type: "datetime", required: true },
    { name: "private", type: "bool", required: true },
    { name: "reminded", type: "bool", required: true }
];
var database = new(require("../core/Database/databaseHandler.js"))('reminders', databaseStructure);
var parser = require('moment-parser');
var logger = require("winston");
var reminderFromString = /[^;%$\|]*/;
var uidFromMention = /<@([0-9]+)>/;

var cachedReminder;

var _disco;

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
    if (split[1]) split[1] = split[1].trim();
    if (split[0] === "" || split[1] === "") {
        e.mention().respond("Missing time variable or message to remind you about\n**Usage**: \nremind <time> [separator] <message> - Will remind you in x about <message>\nAny of the following characters can be used as a separator: **;%$|**");
        return;
    }
    try {
        var parsedTimeTemp = parser.parseDuration(split[0]);
        //e.mention().code(JSON.stringify(parsedTimeTemp), 'javascript').respond();
        if(parsedTimeTemp._milliseconds == Infinity) e.mention().respond("Value too big, fuck off");
        e.mention().respond("Sure, \nI will remind you about it in **" + convertMS(parsedTimeTemp._milliseconds)  + "**");
        storeReminder(e, { private: pm }, new Date(Date.now() + parsedTimeTemp._milliseconds).getTime(), parsedTimeTemp._milliseconds, split[1]);
    } catch (error) {
        var parseUglyValue = parseUgly(split[0]);
        //e.mention().code(JSON.stringify(parseUglyValue, null, '\t'), 'javascript').respond();
        if(!parseUglyValue) return;
        e.mention().respond("Sure, \nI will remind you about it in **" + convertMS(parseUglyValue.relative) + "**");
        storeReminder(e, { private: pm }, parseUglyValue.absolute, parseUglyValue.relative, split[1]);
    }
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

function cacheRemind(disco) { // setup
    _disco = disco;
    getReminder(function (err, res) {
        prepareReminder(res);
    });
}


function prepareReminder(reminderObject) { //check if it should set up a cache for the current reminder or if it's an old reminder, remind it and try to cache next one.
    if (!reminderObject) return;
    var timems = Math.round(reminderObject.time - Date.now());

    if (reminderObject.time === null || reminderObject.relative === null || reminderObject.relative == Infinity) {
      database.update({ "id": reminderObject.id }, { "reminded": true }, function (err, res) {
          if (err) return (logger.error("[REMINDER]: Can't delete reminder with id ", reminderObject.id, " and message: ", reminderObject.message));
          logger.debug("[REMINDER]: Deleted invalid reminder ", reminderObject.id);
          getReminder(function (err, res) {
              prepareReminder(res);
          });
      });
      return;
    }

    if (reminderObject.time < new Date()) { // u wut m8, this is an old reminder what we forgot to remind  ???????
        if (!_disco) return;

        finishRemind(reminderObject, true);
        return;
    }
    if (cachedReminder) clearTimeout(cachedReminder); // murder old reminder, fuck it tbh

    if (timems > 2147483647) return;

    //if(oldCache.id == reminderObject.id) return;

    logger.debug("[REMINDER]: Cached new reminder with id:", reminderObject.id, "and expiration in ms:", timems, "with message `", reminderObject.message, "`");
    cachedReminder = setTimeout(finishRemind, timems, reminderObject);

}

function storeReminder(e, args, time, relative, message) { // this is when new reminders ar added
    //insert into database, delete old reminder and do a getReminder & prepareReminder again
    if(isNaN(time) || relative == Infinity) return;
    database.insert({
        "addedOn": Math.round(new Date(e.rawEvent.d.timestamp).getTime()),
        "userID": e.userID,
        "channelID": e.channelID,
        "message": message,
        "time": Math.round(time),
        "relative": Math.round(relative),
        "private": args.private,
        "reminded": "0"
    }, function (err, res) {
        if (err) return (logger.error("[REMINDER]: Can't store reminder with message: ", message, " and remind time: ", time));
        getReminder(function (err, res) {
            prepareReminder(res);
        });
    });
}

function getReminder(callback) { // gets the top reminder and returns a reminder object
    database.find({ "time": new Date(Date.now() + (86400 * 1000)), "reminded": "0" }, { "time": "<", "_order": { "columnName": "time", "sortOrder": "ASC" } },
        function (err, res) {
            if (err) {
                return (callback && callback(err, null)); }
            if (res.count !== 0) {
                var first = res.result[0]; // why I am just not returning this ???
                return (callback && callback(null, { id: first.id, channelID: first.channelID, userID: first.userID, message: first.message, "private": first.private, time: first.time, addedOn: first.addedOn, relative: first.relative }));
            }
        });
}

function finishRemind(reminderObject, expired) { // set expired to true to show a message along the lines "I am sorry for being late, you told me to remind you on DATE about MESSAGE"
    //set id as reminded
    //get top reminder, when other reminder ends (but calling prepareReminder)
    //deliverReminder(reminderObject, function(err, res){
    var message = `<@${reminderObject.userID}> **REMINDER**\n\n`; //MENTION **REMINDER**\n\n [Sorry, I forgot to remind you of] You told me to remind you of ```MESSAGE`` [**time** ago]. \n\n I was late [**lateTime**];
    message += (expired ? "Sorry, I forgot to remind you of " : "You told me to remind you of ") + "```\n" + (reminderObject.message || "No message") + "```";
    //message += `**${convertMS(reminderObject.time - reminderObject.addedOn)}** ago\n`; // too exact on small values, users shouldn't know about the delays.
    message += `**${expired ? convertMS(Math.round(Date.now() - reminderObject.time)) : convertMS(reminderObject.relative)}** ago\n\n`;
    //if(expired) message += "I was late **" + convertMS(Math.round(Date.now() - reminderObject.time)) + "**";

    if (expired) message += "I was told to remind you of it in **" + convertMS(reminderObject.relative) + "**";
    console.log("FINISHREMINDER", reminderObject);

    _disco.queueMessage((reminderObject.private == '1' ? reminderObject.userID : reminderObject.channelID), message, function (err, res) {
        if (err) return (logger.error("[REMINDER]: Can't remind reminder with id ", reminderObject.id, " and message: ", reminderObject.message));
        database.update({ "id": reminderObject.id }, { "reminded": true }, function (err, res) {
            if (err) return (logger.error("[REMINDER]: Can't delete reminder with id ", reminderObject.id, " and message: ", reminderObject.message));
            logger.debug("[REMINDER]: Finished reminding reminder with id ", reminderObject.id);
            getReminder(function (err, res) {
                prepareReminder(res);
            });
        });
    });
    //}); //deliver the reminder here
}


function checkReminders(e, args) {
  //TODO: add args.mention which lets you check other users reminders. reminder.other is the permission
    var str = "Your reminders: \n";
    database.find({ "userID": e.userID, "reminded": "0" }, {"_order": { "columnName": "time", "sortOrder": "ASC" }}, function (err, res) {
        if (err) {
            console.log(err);
            return (e.mention().respond("Failed database querry."));
        }
        if (res.count === 0) return (e.mention().respond("You don't have any upcoming reminders."));
        for (var i = 0; i < res.count; i++) {
            str += "**" + res.result[i].message + "**" + (res.result[i].private === 1 ? " *[PM]*" : "");
            str += "\n\t" + new Date(parseInt(res.result[i].time));
            str += "\n\t\tIn **" + convertMS(res.result[i].time - Date.now()) + "**\n";
        }
        e.mention().respond(str);
    });
}

function convertMS(ms) {
    var d, h, m, s, _ms, timeString = "";
    _ms = ms % 1000;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    d !== 0 ? timeString += d + " day" + (d > 1 ? "s" : "") + " " : null;
    h !== 0 ? timeString += h + " hour" + (h > 1 ? "s" : "") + " " : null;
    m !== 0 ? timeString += m + " minute" + (m > 1 ? "s" : "") + " " : null;
    s !== 0 ? timeString += s + " second" + (s > 1 ? "s" : "") + " " : null;
    _ms !== 0 ? timeString += _ms + " milisecond" + (_ms > 1 ? "s" : null): null;
    return timeString;
};

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
