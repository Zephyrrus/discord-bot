var fs = require('fs');
var http = require('follow-redirects').http;

function doAnime(e, args){
  args.anime = args.anime + args._str;
  if (args.anime < 2) {
    e.mention().respond("Don't you think that anime title is a *bit too short* ?");
    return;
  }
  var url = "http://hummingbird.me/api/v1/search/anime?query=" + encodeURIComponent(args.anime);
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

        var resultString = "\n__***" + anime.title + "***__\n";

        if (anime.url) {
          if (isAnimeNSFW.toLowerCase() == "r17+") {
            if (e.allowNSFW)
              resultString += "**URL:** " + anime.url + "\n";
          } else {
            resultString += "**URL:** " + anime.url + "\n";
          }
        }

        if(anime.mal_id){
          resultString += "**MyAnimeList url: ** myanimelist.net/anime/" + anime.mal_id + "\n";
        }

        if (anime.status) {
          resultString += "**Current Status:** " + anime.status + "\n";
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
          resultString += "**Average Rating:** " + parseFloat(anime.community_rating).toFixed(2) + "\n";
        }

        if (anime.age_rating) {
          resultString += "**Age Rating:** " + anime.age_rating + "\n"

        }

        if (anime.genres) {
          resultString += "**Genres: **";
          for(var gen of anime.genres)
            resultString += gen.name + ", ";
          resultString += "\n";
        }

        if (anime.synopsis) {
          resultString += "**Synopsis:** ```" + anime.synopsis + "```\n";
        }
        e.mention().respond(resultString);
        return;
      } else {
        e.mention.respond("I can't find that anime on the internet, please check if the title is correct.");
        return;
      }
    });
  }).on('error', function(e) {
    console.log("[AnimeModule] Got an error: ", e);
  });
}


module.exports = {
  "MODULE_HEADER":{
    moduleName: "Anime searcher",
    version: "1.0.6",
    author: "Zephy",
    description: "searches for information about any anime on the hummingbird.me website",
  },
  "anime": {
    permission: "anime",
    helpMessage: "Finds information about the anime",
    category: "Entertainment",
    handler: doAnime,
    cooldown: 5000,
    params:[{
        id: "anime",
        type: "string",
        required: true
    }]
  }
};
