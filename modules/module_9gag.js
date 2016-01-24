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

//module.exports = nineGAGScraper;
module.exports = {
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  category: "entertainment",
  description: "9gag - gets a random post from 9gag",
  action: function(args, e) {
    if (args[0] == "hot") {
      nineGAGScraper("hot");
      getRandom(function(error, data) {
        post9GAG(args, e, {"title": data.title, "link": data.image, "id": data.id});
      });
    }else if(args[0] == "trending"){
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
};

function post9GAG(args, e, gagObject) {
  e.bot.deleteMessage({
    channel: e.channelID,
    messageID: e.rawEvent.d.id
  });
  var link = gagObject.link.replace(/^https:\/\//i, 'http://');
  var filename = "./modules/cache/" + link.split("/").pop();
  var file = fs.createWriteStream(filename);
  var request = http.get(link.toString(), function(response) {
    response.pipe(file);
  });
  request.on('close', function() {
    fs.exists(filename, function(exists) {
      if (exists) {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + ">: **I am grabbing a random image from 9gag for you** \u2764",
        }, function(response) {
          e.bot.uploadFile({
            to: e.channelID,
            file: fs.createReadStream(filename)
          }, function(response) {
            e.bot.sendMessage({
              to: e.channelID,
              message: "Title: **" + gagObject.title + "**",
            });
            fs.unlink(filename);
          });
        });
      }
    });
  });
}
