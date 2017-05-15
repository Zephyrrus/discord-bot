const MAXFIELDS = 24;

var databaseStructure = [{
    name: "id",
    type: "autonumber",
    primaryKey: true
}, {
    name: "addedOn",
    type: "string",
    required: true
}, {
    name: "channelID",
    type: "string",
    required: true
}, {
    name: "userID",
    type: "string",
    required: true
}, {
    name: "message",
    type: "string"
}, {
    name: "time",
    type: "datetime",
    required: true
}, {
    name: "relative",
    type: "datetime",
    required: true
}, {
    name: "private",
    type: "bool",
    required: true
}, {
    name: "reminded",
    type: "bool",
    required: true
}];
var database = new(require("../core/Database/databaseHandler.js"))('reminders', databaseStructure);
var parser = require('moment-parser');
var logger = require("winston");
var reminderFromString = /[^;%$\|]*/;
var uidFromMention = /<@([0-9]+)>/;
var EmbedGenerator = require("./common/utils.js").EmbedGenerator;
var RichEmbed = require("./common/RichEmbed.js");


var cachedReminder;
var autoCacher;
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
        child: [{
            name: "list",
            handler: checkReminders,
            helpMessage: "does magic"
        }, {
            name: "delete",
            handler: deleteReminder,
            helpMessage: "Deletes a previously set reminder",
            params: [{
                id: "id",
                type: "number",
                required: true
            }]
        }]
    }
};

function doRemind(e, args) {
    //var pm = args.flags.pm || false;
    var pm = false;

    //e.respond("State of PM flag: " + pm);
    console.log(args);
    var joinedArguments = args._str;
    var reminder = reminderFromString.exec(joinedArguments)[0];
    var split = [reminder, joinedArguments.substring(reminder.length + 1)];
    split[0] = split[0].trim();
    split[0] = split[0].replace("me ", ""); // support reddit like >remind me thing
    if (split[1]) split[1] = split[1].trim();
    console.log("'" + split[0] + "'");
    if (split[0] === "" || split[1] === "") {
        var embed = new RichEmbed()
            .addField("Error", "Missing time variable or message to remind you about")
            .addField("Usage", "remind <time> [separator] <message> - Will remind you in x about <message>\nAny of the following characters can be used as a separator: **;%$|**")

        e.mention().embed(embed).respond();

        return;
    }

    try {
        var parsedTimeTemp = parser.parseDuration(split[0]);
        if (parsedTimeTemp._milliseconds == Infinity || parsedTimeTemp > 1009152000000) return (e.mention().respond("Sorry, I can't do that. I can only remember reminder in the next 32 years. Blame Zephy."));
        if (parsedTimeTemp < 1000) return (e.mention().respond("Sorry, I was coded by Zephy, my time is not that exact."));

        e.mention().embed(new RichEmbed()
            .addField("I will remind you about it in", convertMS(parsedTimeTemp))
            .addField("Reminder set to", new Date(Date.now() + parsedTimeTemp).toUTCString())
            .setColor("DARK_RED")
        ).respond();

        storeReminder(e, {
            private: pm
        }, new Date(Date.now() + parsedTimeTemp).getTime(), parsedTimeTemp, split[1]);
    } catch (error) {
        e._prepend = ""; // ugly hack to remove double mention
        var parseUglyValue = parseUgly(split[0]);
        if (!parseUglyValue) {
            e.mention().respond("Sorry, I can't understand that time.");
            return;
        }
        if (parseUglyValue.relative == Infinity || parseUglyValue.relative > 1009152000000) return (e.mention().respond("Sorry, I can't do that. I can only remember reminder in the next 32 years. Blame Zephy."));
        e.mention().embed(new RichEmbed()
            .addField("I will remind you about it in", convertMS(parsedTimeTemp))
            .addField("Reminder set to", new Date(parseInt(parseUglyValue.absolute)).toUTCString())
            .setColor("DARK_RED")
        ).respond();
        storeReminder(e, {
            private: pm
        }, parseUglyValue.absolute, parseUglyValue.relative, split[1]);
    }
}

var parseUgly = function(timeout) {
    timeout = timeout.replace(/\s+/g, '');
    var SECONDS = /(\d+) *(?:seconds|seconds|sec|s)/i;
    var MINUTES = /(\d+) *(?:minutes|minute|min|m)/i;
    var HOURS = /(\d+) *(?:hours|hour|h)/i;
    var DAYS = /(\d+) *(?:days|days|d)/i;

    var delta = 0;

    var hours = 0;
    var minutes = 0;
    var seconds = 0;
    var days = 0;
    var years = 0;
    var weeks = 0;

    var s = SECONDS.exec(timeout);
    if (s && s[1]) {
        delta += +s[1];
        seconds += +s[1];
    }

    var s = MINUTES.exec(timeout);
    if (s && s[1]) {
        delta += (+s[1] * 60);
        minutes += +s[1];
    }

    var s = HOURS.exec(timeout);
    if (s && s[1]) {
        delta += (+s[1] * 60 * 60);
        hours += +s[1]
    }

    var s = DAYS.exec(timeout);
    if (s && s[1]) {
        delta += (+s[1] * 60 * 60 * 24);
        days += +s[1]
    }

    if (isNaN((hours + minutes + seconds)) || delta < 1) return false;
    return {
        absolute: new Date().getTime() + (delta * 1000),
        relative: (delta * 1000),
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        days: days,
        years: years
    };
};

function cacheRemind(disco) { // setup
    _disco = disco;

    if (!autoCacher) // dont set another autocacher if there is one working already
        autoCacher = setInterval(function() {
        if (!cachedReminder) {
            getReminder(function(err, res) {
                prepareReminder(res);
            });
        }
    }, 86400000); // 24 hours

    getReminder(function(err, res) {
        prepareReminder(res);
    });
}


function prepareReminder(reminderObject) { //check if it should set up a cache for the current reminder or if it's an old reminder, remind it and try to cache next one.
    if (!reminderObject) return;
    var timems = Math.round(reminderObject.time - Date.now());

    if (reminderObject.time === null || reminderObject.relative === null || reminderObject.relative == Infinity) {
        database.update({
            "id": reminderObject.id
        }, {
            "reminded": true
        }, function(err, res) {
            if (err) return (logger.error("[REMINDER]: Can't delete reminder with id ", reminderObject.id, " and message: ", reminderObject.message));
            logger.debug("[REMINDER]: Deleted invalid reminder ", reminderObject.id);
            getReminder(function(err, res) {
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
    if (cachedReminder) {
        clearTimeout(cachedReminder);
        cachedReminder == null;
    } // murder old reminder, fuck it tbh

    if (timems > 2147483647) return;

    //if(oldCache.id == reminderObject.id) return;

    logger.debug("[REMINDER]: Cached new reminder with id:", reminderObject.id, "and expiration in ms:", timems, "with message `", reminderObject.message, "`");
    cachedReminder = setTimeout(finishRemind, timems, reminderObject);

}

function storeReminder(e, args, time, relative, message) { // this is when new reminders ar added
    //insert into database, delete old reminder and do a getReminder & prepareReminder again
    if (isNaN(time) || relative == Infinity) return;
    database.insert({
        "addedOn": Math.round(new Date(e.rawEvent.d.timestamp).getTime()),
        "userID": e.userID,
        "channelID": e.channelID,
        "message": message,
        "time": Math.round(time),
        "relative": Math.round(relative),
        "private": args.private,
        "reminded": "0"
    }, function(err, res) {
        if (err) return (logger.error("[REMINDER]: Can't store reminder with message: ", message, " and remind time: ", time));
        getReminder(function(err, res) {
            prepareReminder(res);
        });
    });
}

function getReminder(callback) { // gets the top reminder and returns a reminder object
    database.find({
            "time": new Date(Date.now() + (86400 * 1000)),
            "reminded": "0"
        }, {
            "time": "<",
            "_order": {
                "columnName": "time",
                "sortOrder": "ASC"
            }
        },
        function(err, res) {
            if (err) {
                return (callback && callback(err, null));
            }
            if (res.count !== 0) {
                var first = res.result[0]; // why I am just not returning this ???
                return (callback && callback(null, {
                    id: first.id,
                    channelID: first.channelID,
                    userID: first.userID,
                    message: first.message,
                    "private": first.private,
                    time: first.time,
                    addedOn: first.addedOn,
                    relative: first.relative
                }));
            }
        });
}

function finishRemind(reminderObject, expired, retry) { // set expired to true to show a message along the lines "I am sorry for being late, you told me to remind you on DATE about MESSAGE"
    //set id as reminded
    //get top reminder, when other reminder ends (but calling prepareReminder)
    var message = `<@${reminderObject.userID}> 💥**EXUPLOSHION**💥\n\n`; //MENTION **REMINDER**\n\n [Sorry, I forgot to remind you of] You told me to remind you of ```MESSAGE`` [**time** ago]. \n\n I was late [**lateTime**];
    /*message += (expired ? "Sorry, I forgot to remind you of " : "You told me to remind you of ") + "```\n" + (reminderObject.message || "No message") + "```";
    //message += `**${convertMS(reminderObject.time - reminderObject.addedOn)}** ago\n`; // too exact on small values, users shouldn't know about the delays.
    message += `**${expired ? convertMS(Math.round(Date.now() - reminderObject.time)) : convertMS(reminderObject.relative)}** ago\n\n`;
    //if(expired) message += "I was late **" + convertMS(Math.round(Date.now() - reminderObject.time)) + "**";

    if (expired) message += "I was told to remind you of it in **" + convertMS(reminderObject.relative) + "**";*/


    var embed = new RichEmbed();
    embed.setTitle((expired ? "Sorry, I forgot to remind you of" : "You told me to remind you of"))
        .setDescription((reminderObject.message || "No message"))
        .setColor("DARK_RED")
        .addField("Reminder set", `**${expired ? convertMS(Math.round(Date.now() - reminderObject.time)) : convertMS(reminderObject.relative)}** ago`);

    if (expired) embed.addField("I was told to remind you of it in", convertMS(reminderObject.relative));

    console.log("FINISHREMINDER", reminderObject);

    _disco.queueMessage((reminderObject.private == '1' ? reminderObject.userID : reminderObject.channelID), message, embed, function(err, res) {
        if (err) {
            if (!retry) {
                finishRemind(reminderObject, expired, 1);
                return;
            } else {
                logger.error("[REMINDER]: Can't remind reminder with id ", reminderObject.id, " and message: ", reminderObject.message);
            }
        }
        //TODO: retry in 2 minutes or delete;
        database.update({
            "id": reminderObject.id
        }, {
            "reminded": true
        }, function(err, res) {
            if (err) return (logger.error("[REMINDER]: Can't delete reminder with id ", reminderObject.id, " and message: ", reminderObject.message));
            logger.debug("[REMINDER]: Finished reminding reminder with id ", reminderObject.id);
            getReminder(function(err, res) {
                prepareReminder(res);
            });
        });
    });
}


function checkReminders(e, args) {
    database.find({
        "userID": e.userID,
        "reminded": "0"
    }, {
        "_order": {
            "columnName": "time",
            "sortOrder": "ASC"
        }
    }, function(err, res) {
        if (err) {
            console.log(err);
            return (e.mention().respond("Failed database querry."));
        }

        var embed = new RichEmbed();
        embed.setTitle("**Your reminders:**")
            .setColor("DARK_RED");

        if (res.count === 0) embed.setDescription((reminderObject.message || "No message"));


        for (var i = 0; i < (res.count < MAXFIELDS ? res.count : MAXFIELDS); i++) {
            embed.addField(
                "**" + e.clean(res.result[i].message) + "**" + (res.result[i].private === 1 ? " *[PM]* " : " ") + "*[" + res.result[i].id + "]*",
                "In **" + convertMS(res.result[i].time - Date.now()) + "** on **" + new Date(parseInt(res.result[i].time)).toUTCString() + "**"
            );
        }
        e.mention().respond("Check DM!");
        e.embed(embed).pm();
    });
}

function deleteReminder(e, args) {
    database.find({
        "id": args.id,
        "userID": e.userID,
        "reminded": "0"
    }, {
        "_order": {
            "columnName": "time",
            "sortOrder": "ASC"
        }
    }, function(err, res) {
        if (err) {
            console.log(err);
            return (e.mention().respond("Failed database querry."));
        }

        if (res.count != 1) return (e.mention().respond("Invalid reminder specified"));

        var result = res.result[0];

        database.update({
            "id": args.id,
            "userID": e.userID,
            "reminded": "0"
        }, {reminded: true}, function(err) {
            if(err) {
                logger.error(err);
                return;
            }
            e.mention().embed(new RichEmbed().setTitle(`🗑 Deleted reminder with id *${args.id}*`)).respond();
                if (cachedReminder) {
                    clearTimeout(cachedReminder);
                    cachedReminder == null;
                } // murder old reminder, fuck it tbh

            getReminder(function(err, res) {
                prepareReminder(res);
            });
        });

    });
}

function convertMS(ms) {
    return forHumans(Math.floor(ms / 1000)); // use new time conversion
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
    _ms !== 0 ? timeString += _ms + " milisecond" + (_ms > 1 ? "s" : null) : null;
    return timeString;
};

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 * 
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the the amount of time
 */
function forHumans(seconds) {
    var levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 604800), 'weeks'],
        [Math.floor(((seconds % 31536000) % 604800) / 86400), 'days'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
        [((((seconds % 31536000) % 86400) % 3600) % 60), 'seconds'],
    ];
    var returntext = '';

    for (var i = 0, max = levels.length; i < max; i++) {
        if (levels[i][0] === 0) continue;
        if (levels[i][0] === 0.00) continue;
        returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
    };
    return returntext.trim();
}