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

function getSubreddit(subreddit, callback) {
  var ret;
  var links = [];
  reddit('/r/' + subreddit + '/hot').listing({
    limit: 100
  }).then(
    function(result) {
      for (var child of result.get.data.children) {
        child.data.url = child.data.url.replace(/\?.*$/i, '');
        var r = new RegExp("(\.png|\.jpg|\.png,\.jpg)");
        if (r.test(child.data.url)) links.push(child.data.url);
      }
      return result.next(); // send the paging to the next then for getting the next slice
    }).then(function(result) { // get the next slice for more images
      for (var child of result.get.data.children) {
        child.data.url = child.data.url.replace(/\?.*$/i, '');
        var r = new RegExp("(\.png|\.jpg|\.png,\.jpg)");
        if (r.test(child.data.url)) links.push(child.data.url);
      }
      return callback(links[randomInt(0, links.length)]);
  });
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

module.exports = {
  getSubreddit: getSubreddit
};
