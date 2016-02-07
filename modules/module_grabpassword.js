var utils = require('./utils.js');

module.exports = {
  lastTime: 0,
  cooldown: 1000,
  properties: {
    "module": true,
    "info": {
      "description": "used to get a random password form Fillerino's webpage",
      "author": "Zephy & Fillerino",
      "version": "1.0.0",
      "importance": "addon",
      "name": "Password generator",
      "moduleName": "password"
    },
    "requiresDB": false,
  },
  description: "password - gets a random password",
  category: "misc",
  permission: {
    onlyMonitored: true
  },
  action: function (args, e) {
    utils.getJSONHTTP("http://www.fillerix.cf/api/pwapi.php", function (err, resp) {
      try{
        var response = JSON.parse(resp);
        if(response && response.pw){
          e.bot.sendMessage({
            to: e.channelID,
            message: "**I generated a random password for you:**```\n" + response.pw + "```"
          });
        }
      }catch(err){
        e.printError(e.channelID, err);
      }

    });
  }

};
