var request = require("request");
var logger = require("winston");
var cheerio = require("cheerio");
var fs = require("fs");


module.exports = {
  "MODULE_HEADER":{
    moduleName: "Bash scraper",
    version: "1.0.6",
    author: "Zephy",
    description: "returns a random quote from bash"
  },
  "bash": {
    permission: "bash",
    helpMessage: "returns a random qoute from bash.org",
    category: "Entertainment",
    handler: bashGrab,
    params:[{
      id: "bashID",
      type: "number",
      required: false
    }]
  }
}

function bashGrab(e, args) {
    var getID = /href=\"?(.*?)\"/i;

    function getQuote(url, callback) {
        logger.debug("get " + url);
        callback = callback || (() => {});
        request(url, function (err, response, body) {
            try {
                if (err) {
                    callback(err);
                    return;
                }
                // use cheerio to get a jquery object
                var $ = cheerio.load(body);
                if ($('.qt').first()) {
                    return (callback && callback(null, { content: $('.qt').first().text(), id: $('.quote').first().find('a').first().attr("href") }))
                }

                callback("Never received anything ;-;-;-;-;-;-;-;-;-;-;-;");
            } catch (e) {
                callback(e);
            }

        });
    }
    var url = "http://bash.org/?";

    if (args.bashID) {url += args.bashID;}
    else {url += "random";}

    getQuote(url, function (err, res) {
        if (err) {
            e.mention().respond("Failed to do that:\n```\n" + err.message + "\n```");
            return;
        }
        if (res && res.content.length > 2) {
            e.mention().respond("Here's your " + (args.bashID ? "":"random ") +"bash.org quote \n```\n" + res.content + "\n```\nPermalink: http://bash.org/" + res.id);
        } else {
            e.mention().respond("That bash does not exist, I am sorry ;-;");
        }
    });
}
