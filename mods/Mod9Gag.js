var fs = require('fs');
var http = require('follow-redirects').http;
var XrayLib = require('x-ray'),
  xray = new XrayLib(),
  _ = require('lodash');

var base9GAGUrl = "http://9gag.com"; // 9GAG Url
var error_callback = "cannot scrape data"; // Default error message for callbacks
var image_formats = ['jpg', 'jpeg', 'png']; // Image types

var types = {
  random: 'random',
  gif: 'gif'
};

var random_url = "/random"; // Random meme Url
var random_settings = ['body', {
  id: '.badge-page .main-wrap section article @data-entry-id',
  url: '.badge-page .main-wrap section article @data-entry-url',
  title: '.badge-page .main-wrap section header h2 ',
  image: '.badge-page .main-wrap section .post-container img @src'
}];

var default_settings = ['body .badge-page .main-wrap section .badge-entry-collection', {
  data: xray('article', [{
    id: '@data-entry-id',
    url: '@data-entry-url',
    title: 'h2 a ',
    image: '.post-container img @src'
  }])
}];

function nineGAGScraper(type) {
  this.type = type || "hot";
};

function getRandom(callback) {
  scrapeRandom(callback);
};

function getGags(callback) {

  if (this.type === types.random) {
    scrapeRandom(callback);
  } else {
    var url = "/" + this.type;
    scrapeAll(url, default_settings, callback);
  }

};

function scrapeAll(url, properties, callback) {

  if (!callback)
    return;

  baseScraper(base9GAGUrl + url, properties[0], properties[1], function(error, data) {

    if (error || !data) {
      callback(error_callback, null);
      return;
    }

    var response = {};
    response.count = data[0].data.length;
    response.gags = [];

    _.forEach(data[0].data, function(scrapedData, key) {
      scrapedData.title = scrapedData.title.trim();
      if (scrapedData.image)
        response.gags.push(scrapedData);
    });

    callback(null, response);

  });

}

function scrapeRandom(callback) {

  if (!callback)
    return;

  baseScraper(base9GAGUrl + random_url, random_settings[0], random_settings[1], function(error, data) {


    if (!data[0].image || _.isNull(data[0].image) || !_.isNull(error)) {
      //console.log("no data");
      scrapeRandom(callback);
    } else {
      var ext = data[0].image.substring(data[0].image.lastIndexOf(".") + 1);

      if (isInArray(ext, image_formats)) {
        callback(null, data[0]);
      } else {
        scrapeRandom(callback);
      }

    }

  });

}

function baseScraper(url, scrapeEntryPoint, properties, callback) {
  xray(url, scrapeEntryPoint, [properties])(function(err, data) {
    callback(err, data);
  });
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

function do9GAG(e, args){
    if (args.board == "hot") {
      nineGAGScraper("hot");
      getRandom(function(error, data) {
        post9GAG(args, e, {"title": data.title, "link": data.image, "id": data.id});
      });
    }else if(args.board == "trending"){
      nineGAGScraper("trending");
      getRandom(function(error, data) {
        post9GAG(args, e, {"title": data.title, "link": data.image, "id": data.id});
      });
    }else{
      nineGAGScraper("random");
      getRandom(function(error, data) {
        post9GAG(args, e, {"title": data.title, "link": data.image, "id": data.id});
      });
    }
}
module.exports = {
  "MODULE_HEADER":{
    moduleName: "9GAG scraper",
    version: "1.0.2",
    author: "Zephy",
    description: "9GAG scraper and poster",
  },
  "9gag": {
    permission: "9gag",
    helpMessage: "- random post from 9gag",
    category: "Entertainment",
    handler: do9GAG,
    params: [{
        id: "board",
        type: "choice",
        options: {
            list: ["hot", "trending", "random"]
        },
        required: false
    }],
    cooldown: 5000
  }
}

function post9GAG(args, e, gagObject) {
  e.deleteMessage();
  /*var link = gagObject.link.replace(/^https:\/\//i, 'http://');
  var filename = link.split("/").pop();*/
  e.mention().respond("Title: **" + gagObject.title + "**\n" + gagObject.link);
    /*request(link.toString(), {encoding: null}, function(err, res, body) {
      e.mention().respond("**I am grabbing a random image from 9gag for you** \u2764", function(err, res){
        e._disco.bot.uploadFile({
            to: e.channelID,
            file: body,
            filename: filename
        });
      }).sendMessage("Title: **" + gagObject.title + "**");
    });*/
}
