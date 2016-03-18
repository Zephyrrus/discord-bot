var request = require("request");
var logger = require("winston");
var cheerio = require("cheerio");
var fs = require("fs");

module.exports = {
  properties: {
  "module": true,
  "info": {
    "description": "returns a random quote from bash",
    "author": "Zephy",
    "version": "1.0.2",
    "importance": "addon",
    "name": "Bash scraper",
    "moduleName": "bashscraper"
  },
  "requiresDB": false,
},
  lastTime: 0,
  cooldown: 2000,
  permission: {
    onlyMonitored: true
  },
  category: "entertainment",
  description: "bash - returns a random qoute from bash.org",
  action: function(args, e) {
    bashGrab(e);
  }
};

function bashGrab(e, args) {
    var getID = /href=\"?(.*?)\"/i;
    function getQuote(url, callback) {
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
                if($('.qt').first()){
                  /*console.log($('.quote').first().find('a').first().attr("href"));
                  var id = getID.exec($('.qt')[0].previousSibling.innerHTML);*/
                  return (callback && callback(null, {content: $('.qt').first().text(), id:$('.quote').first().find('a').first().attr("href")}))
                }

                callback("Never received anything ;-;-;-;-;-;-;-;-;-;-;-;");
            } catch(e) {
                callback(e);
            }

        });
    }

    getQuote("http://bash.org/?random", function(err, res) {
        if(err) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> Failed to do that:\n```\n" + err.message + "\n```"
          });
          return;
        }
        if(res) {
          e.bot.sendMessage({
            to: e.channelID,
            message: "<@" + e.userID + "> Here's your random bash.org quote \n```\n" + res.content + "\n```\nPermalink: http://bash.org/" + res.id
          });
        } else {
            e.bot.sendMessage({
              to: e.channelID,
              message: "<@" + e.userID + "> Looks like bash is not responding ;-;"
            });
        }
    });
}
