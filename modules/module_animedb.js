var fs = require('fs');
var http = require('follow-redirects').http;

module.exports = {
  properties: {
  "module": true,
  "info": {
    "description": "searches for information about any anime on the humminbird.me website",
    "author": "Zephy",
    "version": "1.0.0",
    "importance": "addon",
    "name": "Anime searcher",
    "moduleName": "anime"
  },
  "requiresDB": false,
},
  category: "anime",
  description: "anime <anime> - Finds information about the anime",
  lastTime: 0,
  cooldown: 5000,
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    if(!args[0]){
      return;
    }
    if (args[0].length < 2) {
      e.bot.sendMessage({
        to: e.channelID,
        message: "Don't you think that anime title is a *bit too short* ?"
      });
      return;
    }
    var url = "http://hummingbird.me/api/v1/search/anime?query=" + encodeURIComponent(args.join(" "));
    console.log(url);
    http.get(url, function(res) {
      var body = '';

      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function() {
        var response = JSON.parse(body);
        //console.log(response[0]);
        if (response[0]) {
          var anime = response[0];
          var isAnimeNSFW = "false";
          if (anime.age_rating)
            isAnimeNSFW = anime.age_rating;

          var resultString = "<@" + e.userID + ">\n__***" + anime.title + "***__\n";

          if (anime.url) {
            if (isAnimeNSFW.toLowerCase() == "r17+") {
              if (e.config.allowNSFW)
                resultString += "**URL:** " + anime.url + "\n";
              } else {
                resultString += "**URL:** " + anime.url + "\n";
            }
          }

          if(anime.mal_id){
            resultString += "**MyAnimeList url: ** myanimelist.net/anime/" + anime.mal_id + "\n";
          }

          if (anime.status) {
            resultString += "**Current Status:** " + anime.status + "\n"
          }


          if (anime.started_airing) {
            if (new Date(anime.started_airing).getTime() > new Date().getTime()) {
              resultString += "**Will Air:** " + anime.started_airing + "\n";
            } else {
              resultString += "**Started Airing:** " + anime.started_airing + "\n";
            }
          }

          if (anime.finished_airing) {
            if (new Date(anime.finished_airing).getTime() > new Date().getTime()) {
              resultString += "**Will Finish Airing:** " + anime.finished_airing + "\n";
            } else {
              resultString += "**Finished Airing:** " + anime.finished_airing + "\n";
            }
          }

          if (anime.episode_count) {
            resultString += "**Total Episodes:** " + anime.episode_count + "\n";
          }

          if (anime.community_rating) {
            resultString += "**Average Rating:** " + parseFloat(anime.community_rating).toFixed(2) + "\n"
          }

          if (anime.age_rating) {
            resultString += "**Age Rating:** " + anime.age_rating + "\n"

          }

          if (anime.genres) {
            resultString += "**Genres: **"
            for(var gen of anime.genres)
              resultString += gen.name + ", ";
            resultString += "\n";
          }

          if (anime.synopsis) {
            resultString += "**Synopsis:** ```" + anime.synopsis + "```\n";
          }
          e.bot.sendMessage({
            to: e.channelID,
            message: resultString
          });
        } else {
          e.bot.sendMessage({
            to: e.channelID,
            message: "I can't find that anime on the internet, please check if the title is correct."
          });
          return;
        }
      });
    }).on('error', function(e) {
      console.log("[AnimeModule] Got an error: ", e);
    });

  }
}
