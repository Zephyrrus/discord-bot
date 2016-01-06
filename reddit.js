var Snoocore = require('snoocore');
var reddit = new Snoocore({
  userAgent: 'DISCORD.bot', // unique string identifying the app
  throttle: 300,
  oauth: {
    type: 'script',
    key: 'APP KEY', // OAuth client key (provided at reddit app)
    secret: 'SECRET KEY', // OAuth secret (provided at reddit app)
    username: 'redditdiscord', // Reddit username used to make the reddit app
    password: 'INSERT PASSWORD HERE', // Reddit password for the username
    // The OAuth scopes that we need to make the calls that we
    // want. The reddit documentation will specify which scope
    // is needed for evey call
    scope: ['identity', 'read', 'vote']
  }
});


function getKemo(callback) {
  var ret;
  reddit('/r/kemonomimi/hot').get().then(function(result) {
    //console.log(JSON.stringify(result.data.children[0].data.url, null, '\t').replace(/`/g, '\u200B`'));
    for (var child of result.data.children) {
      var r = new RegExp("(\.png|\.jpg|\.png,\.jpg)");
      //console.log(r.test(child.data.url));
      if(r.test(child.data.url)) return callback(child.data.url);

      //console.log(JSON.stringify(child.data.url, null, '\t').replace(/`/g, '\u200B`'));
    }
  });
}

function consoleLogJson(str) {

}


module.exports = {
	getKemo: getKemo
};
