var request = require("request");
var logger = require("winston");
var cheerio = require("cheerio");
var fs = require("fs");

module.exports = {
      "MODULE_HEADER":{
        moduleName: "Zerochan scrapper",
        version: "1.0.3",
        author: "Zephy & Windsdon",
        description: "returns an image of a character from zerochan",
      },
      "zero": {
        helpMessage: "Searches for your character on zerochan",
        category: "Entertainment",
        params: [
                {
                    id: "character",
                    type: "string",
                    required: true
                }
            ],
        handler: zeroGrab,
        cooldown: 5000
      }
}

function zeroGrab(e, args) {
    args.character += args._str;
    var name = args.character.replace(/ +/gi, "+");
    // returns a all images on a page
    // solves redirects automatically
    function getPage(url, callback) {
        logger.debug("get " + url);
        callback = callback || (() => {});
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
                    e._disco.bot.sendMessage({
                      to: e.channelID,
                      message: `Assuming ${args.character} reffers to ${decodeURIComponent(path.replace(/\//g, '').replace(/\+/g, ' '))}`
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
          e._disco.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> Failed to do that:\n```\n" + err.message + "\n```"
          });
          return;
        }
        if(o.list && o.list.length != 0) {
          e._disco.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> I found a picture of **" + args.character + "**:\n" + o.list[Math.floor(Math.random() * o.list.length)].url + " for you."
          });
        } else {
            e._disco.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> I can't find any images of **" + args.character + "** :("
            });
        }
    });
}
