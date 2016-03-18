var waifus = require("./waifus.json");
var fs = require('fs');
var aniScraper = require("./anilistScraper.js");
var http = require("follow-redirects").https;

var fuzzySettings = {
    caseSensitive: false,
    includeScore: true,
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 128,
    keys: ["series"]
};
var Fuse = require('fuse.js');
var fuse = new Fuse(waifus, fuzzySettings);


module.exports = {
    properties: {
        "module": true,
        "info": {
            "description": "waifu module",
            "author": "Zephy",
            "version": "1.0.1",
            "importance": "addon",
            "name": "Waifu weeb module",
            "moduleName": "waifuizer"
        },
        "requiresDB": false,
    },
    lastTime: 0,
    cooldown: 1000,
    category: "misc",
    description: "waifu <me>",
    permission: {
        onlyMonitored: true
    },
    action: function (args, e) {
        doWaifu(e, args);
    }
};

doWaifu = function (e, args) {
    if (args[0] != undefined && args.join(" ").length > 2 && args.join(" ").length < fuzzySettings.maxPatternLength) {
        e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> You sneaky bastard, you have waifu preferences. I'll see what I can do about this for you. ;)"
        }, function (error, response) {
            var result = fuse.search(args.join(" "));
            console.log(result);
            if (result.length > 0) {
                e.bot.editMessage({
                    channel: response.channel_id,
                    messageID: response.id,
                    message: "<@" + e.userID + "> You sneaky bastard, you have waifu preferences. I'll see what I can do about this for you. ;)\n\nI think I found something for you <3"
                }, function (error, response) {
                    getWaifu(e, result[randomInt(0, result.length)]);
                    return;
                });

            } else {
                e.bot.editMessage({
                    channel: response.channel_id,
                    messageID: response.id,
                    message: "<@" + e.userID + "> You sneaky bastard, you have waifu preferences. I'll see what I can do about this for you. ;)\n\nSorry, I can't find anything based on your query. I will search for a random waifu for you"
                }, function (error, response) {
                    var waifu = waifus[randomInt(0, waifus.length)];
                    getWaifu(e, waifu);
                    return;
                });
            }
        });
    }else{
      var waifu = waifus[randomInt(0, waifus.length)];
      getWaifu(e, waifu);
    }
}

function getWaifu(e, waifuObject) {
    var location = "./modules/waifu/img/" + waifuObject.series + "/" + waifuObject.name + "." + waifuObject.filetype;
    e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Your perfect waifu is **" + waifuObject.name + "** from **" + waifuObject.series + "**"
    }, function (err, response) {
        fs.exists(location, function (exists) {
            if (exists) {
                e.bot.uploadFile({
                    to: e.channelID,
                    file: location
                }, function (error, response) {
                    if (error != undefined && error.indexOf("403") > -1) {
                        e.logger.error("[waifu] error: " + error);
                        e.bot.sendMessage({
                            to: e.channelID,
                            message: "I don't have the permissions to upload files on this channel, wait untill my lazyass developer upload every image to a server"
                        });
                    }
                });
            } else {
                e.logger.error("[waifu] File not existando: " + location);

                aniScraper.getAvatar(waifuObject.name, function(err, res){
                  if(err) return (e.printError(e.channelID, err));
                  try{
                    if (!fs.existsSync("./modules/waifu/img/")){
                      fs.mkdirSync("./modules/waifu/img/");
                    }
                    if (!fs.existsSync("./modules/waifu/img/" + waifuObject.series)){
                      fs.mkdirSync("./modules/waifu/img/" + waifuObject.series);
                    }
                    if(res != undefined){
                      var link = res.image_url_lge.toString();
                      link = link.replace(/^http:\/\//i, 'https://');
                      var filename = "./modules/waifu/img/" + waifuObject.series + "/" + waifuObject.name + ".jpg";
                      var file = fs.createWriteStream(filename);
                      var request = http.get(link.toString(), function(response) {
                        response.pipe(file);
                      });
                      request.on('close', function() {
                        fs.exists(filename, function(exists) {
                          if (exists) {
                            e.bot.uploadFile({
                              to: e.channelID,
                              file: filename
                            });
                          }
                        });
                      });
                    }else{
                      e.logger.error(err + ":" + res);
                    }
                  }catch(err){

                  }
                  //download file and link it+
                });
            }
        });
    });
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
