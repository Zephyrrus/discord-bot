var Snoocore = require('snoocore');
var auth = require('./auth.json');
var reddit = new Snoocore({
  userAgent: 'DISCORD.bot', // unique string identifying the app
  throttle: 300,
  oauth: {
    type: 'script',
    key: auth.reddit_key, // OAuth client key (provided at reddit app)
    secret: auth.reddit_secret, // OAuth secret (provided at reddit app)
    username: auth.reddit_username, // Reddit username used to make the reddit app
    password: auth.reddit_password, // Reddit password for the username
    // The OAuth scopes that we need to make the calls that we
    // want. The reddit documentation will specify which scope
    // is needed for evey call
    scope: ['identity', 'read', 'vote']
  }
});

// TODO REMOVE THIS LATER AND USE getSubreddit UNIVERSALLY
function getKemo(callback) {
  var ret;
  var links = [];
  reddit('/r/kemonomimi/hot').get().then(function(result) {
    //console.log(JSON.stringify(result.data.children[0].data.url, null, '\t').replace(/`/g, '\u200B`'));
    for (var child of result.data.children) {
      var r = new RegExp("(\.png|\.jpg|\.gif|\.png,\.jpg,\.gif)");
      //console.log(r.test(child.data.url));
      if(r.test(child.data.url)) links.push(child.data.url);
      //console.log(JSON.stringify(child.data.url, null, '\t').replace(/`/g, '\u200B`'));
    }
    //console.log(links);
    var random = randomInt(0, links.length);
    console.log("Random: " + random);
    return callback(links[random]);
  });

}

function getSubreddit(subreddit, callback) {
  var ret;
  var links = [];
  reddit('/r/' + subreddit + '/hot').get().then(
    function(result) {
    //console.log(JSON.stringify(result.data.children[0].data.url, null, '\t').replace(/`/g, '\u200B`'));
    for (var child of result.data.children) {
      var r = new RegExp("(\.png|\.jpg|\.gif|\.png,\.jpg,\.gif)");
      //console.log(r.test(child.data.url));
      if(r.test(child.data.url)) links.push(child.data.url);
      //console.log(JSON.stringify(child.data.url, null, '\t').replace(/`/g, '\u200B`'));
    }
    //console.log(links);
    return callback(links[randomInt(0, links.length)]);
  });
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
/*function randomInt(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}*/

module.exports = {
	getKemo: getKemo,
  getSubreddit: getSubreddit
};
