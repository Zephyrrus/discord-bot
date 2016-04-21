var databaseStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "youtubeID", type: "string", required: true, unique: true },
    { name: "title", type: "string" },
    { name: "addedDate", type: "datetime", required: true },
    { name: "addedBy", type: "number", required: true },
    { name: "tags", type: "string" }
];
var youtubeModule = require("./youtube/_youtube.js");
var utils = require("./common/utils.js");
var database = new(require("../core/Database/databaseHandler.js"))('nightcore', databaseStructure);
var regex = new RegExp("^[a-zA-Z0-9\-\_]+$");

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Nightcore dispenser",
        version: "1.1.0",
        author: "Zephy",
        description: "nightcore dispenser module",
    },
    "nightcore": {
        permission: "nightcore",
        helpMessage: "Dispenses a random nightcore from the database",
        category: "Entertainment",
        handler: getNighcore,
        child: [{
            name: "add",
            handler: addNightcore,
            helpMessage: "Adds a nightcore to the database",
            params: [{
                id: "youtubeID",
                type: "string",
                required: true
            }]
        }, {
            name: "delete",
            handler: deleteNighcore,
            helpMessage: "Deletes a nightcore from the database",
            params: [{
                id: "youtubeID",
                type: "string",
                required: true
            }]
        },
        {
            name: "playlist",
            handler: generatePlaylist,
            helpMessage: "Generates playlists with every song from the database."
        },
        {
            name: "count",
            handler: getCount,
            helpMessage: "Gets the count of the nightcores stored in the database."
        },
        {
            name: "list",
            handler: getList,
            helpMessage: "Will dump the bot's database in pm. Warning: lot of messages."
        }]
    }
}

function getNighcore(e, args) {
    database.random(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        e.mention().respond("I found the perfect song for you in my database \nTitle: **" + res.result[0].title + "**\nLink: https://youtu.be/" + res.result[0].youtubeID)
    });
}

function addNightcore(e, args) {
    if (args.youtubeID.length != 11) {
        e.mention().respond("I can't learn this song, it's id seems to be invalid.")
        return;
    }

    if (regex.test(args.youtubeID)) {
        database.find([{ "youtubeID": args.youtubeID.toString() }], function (err, res) {
            if (err) return (e.respond("```javascript\n" + JSON.stringify(err) + "```"));
            if (res.count > 0) {
                e.mention().respond("I already know this song **" + args.youtubeID + "**");
                return;
            } else {
                e.mention().respond("I'm looking up that youtube ID if it's correct, please wait a few seconds!\n", function (error, response) {
                    youtubeModule.gettitlefromid(args.youtubeID, function (resp) {
                        if (resp != undefined) {
                            database.add([{ "youtubeID": args.youtubeID }, { "title": resp.title }, { "addedDate": Date() }, { "addedBy": e.userID }, { "tags": JSON.stringify(resp.tags || ["null"]) }], function (err, res) {
                                if (err) return (e.printError(e.channelID, err));
                                e.mention().editMessage(response.id, e.channelID, "Thanks for teaching me this song.\nTitle: **" + resp.title + "**\n");
                                return;
                            });
                        } else {
                            e.mention().editMessage(response.id, e.channelID, "An error happened while tyring to add `[" + args.youtubeID + "]`, please try again later. (Undefined response from youtube API)");
                            return;
                        } //end if resp undefined
                    });
                })
            } // end database exists counter if
        });
    } else {
        e.mention().respond("Hah nice try, but I am not stupid. \n(Invalid character in your id)");
    }
}


function deleteNighcore(e, args) {
    if (args.youtubeID.length != 11) {
        e.mention().respond("I can't learn this song, it's id seems to be invalid.")
        return;
    }
    if (regex.test(args.youtubeID)) {
        database.find([{ "youtubeID": args.youtubeID.toString() }], function (err, res) {
            if (err) return (e.printError(e.channelID, err));
            if (res.count < 1) {
                e.mention().respond("I don't know this video.");
                return;
            } else {
                database.delete([{ "youtubeID": args.youtubeID.toString() }], function (err, res) {
                    if (err) return (e.printError(e.channelID, err));
                    e.mention().respond("I forgot that video.");
                })
            }
        });
    }
}

function generatePlaylist(e, args) {
    var _sendPlaylistDelay = function (e, list, counter) {
            counter = counter || 0;
            var maxValues = 20;
            var delayInSecond = 1;
            var ids = "";
            for (var i = counter; i < maxValues + counter && i < list.length; i++) {
                if ((i + 1 == list.length) || (i + 1 == maxValues + counter)) ids += list[i];
                else ids += list[i] + ",";
            }
            e.pm("https://www.youtube.com/watch_videos?video_ids=" + ids, function (err, res) {
                if ((counter + maxValues) < list.length) {
                    setTimeout(function () {
                        _sendPlaylistDelay(e, list, (counter + maxValues));
                    }, delayInSecond * 1000);
                }
            });
        } //_sendPlaylistDelay

    database.list(function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        var list = [];
        for (var i = 0; i < res.count; i++) {
            list.push(res.result[i].youtubeID);
        }
        e.mention().respond("Please wait, I am generating the playlist for you and I will send them as a private messages.", function (err, res) {
            if (err) return;
            _sendPlaylistDelay(e, list);
        })
    });
}

function getCount(e, args){
  database.list(function (err, res) {
      if (err) return (e.printError(e.channelID, err));
      e.mention.respond("I know **" + res.count + "** nightcores in total");
  });
}

function getList(e, args){
  var result = [];
  var count = 0;
  database.list(function (err, res) {
      if (err) return (e.printError(e.channelID, err));
      count = res.count;
      for (var i = 0; i < res.count; i++) {
          result += res.result[i].youtubeID + " - **" + res.result[i].title + "**\n";
      }
      e.pmRespondLong("Listing every nightcore I know: [Count: **" + count + "**]\n\n" + result + "");
  });
}
