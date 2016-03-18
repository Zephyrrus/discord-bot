var request = require("request");
var logger = require("winston");
var cheerio = require("cheerio");
var fs = require("fs");

module.exports = {
  properties: {
  "module": true,
  "info": {
    "description": "returns an image of a character from zerochan",
    "author": "Windsdon",
    "version": "1.0.0",
    "importance": "addon",
    "name": "Zerochan searcher",
    "moduleName": "zeroscraper"
  },
  "requiresDB": false,
},
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  category: "entertainment",
  description: "zero <character name> - searches for your character on zerochan",
  action: function(args, e) {
    if(args[0] == "") {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> No character name"
      });
      return
    }
    var final = args.join(" ");
    zeroGrab(e, final);
  }
};

function zeroGrab(e, args) {
    var name = args.replace(/ +/gi, "+");
    // returns a all images on a page
    // solves redirects automatically
    function getPage(url, callback) {
        logger.debug("get " + url);
        callback = callback || () => {};
        request(url, function(err, response, body) {
            try {
                if(err) {
                    callback(err);
                    return;
                }

                // use cheerio to get a jquery object
                var $ = cheerio.load(body);

                if($("#children").length != 0) { // results page
                    var path = $("#children").find("li").first().find("a").first().attr("href");
                    logger.debug(`${url} redirects to ${path}`);
                    //e.mention().respond(`Assuming ${args.name} reffers to ${path.replace(/\//g, '').replace(/\+/g, ' ')}`);
                    e.bot.sendMessage({
                      to: e.channelID,
                      message: `Assuming ${args} reffers to ${decodeURIComponent(path.replace(/\//g, '').replace(/\+/g, ' '))}`
                    }, function(err, resp){
                      getPage("http://zerochan.net" + path, callback);
                    });
                    return;
                }

                if($("#thumbs2").length != 0) {
                    if($("p.pagination").length != 0 && url.indexOf("?") == -1) { // see if we have multiple pages
                        var k = $("p.pagination").text().match(/[0-9]+ +of +([0-9]+)/i);
                        if(k) {
                            // get a random page
                            getPage(url + "?p=" + Math.min(Math.floor(Math.random() * (k[1] - 1) + 1), 100), callback);
                            return;
                        }
                    }

                    var list = [];
                    $("#thumbs2").find("img").each(function(){
                        var fullurl = $(this).attr("src").replace(/s3\./, "static.").replace(/\.240\./, ".full.");
                        list.push({
                            url: fullurl
                        });
                    });

                    logger.debug(JSON.stringify(list));
                }

                callback(null, {
                    list: list
                });
            } catch(e) {
                callback(e);
            }

        });
    }

    getPage("http://www.zerochan.net/search?q=" + name, function(err, o) {
        if(err) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> Failed to do that:\n```\n" + err.message + "\n```"
          });
          return;
        }
        if(o.list && o.list.length != 0) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I found a picture of **" + args + "**:\n" + o.list[Math.floor(Math.random() * o.list.length)].url + " for you."
          });
        } else {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> I can't find any images of **" + args + "** :("
            });
        }
    });
}
