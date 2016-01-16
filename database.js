var fs = require("fs");

function database() {
    this.groups = require("./db/groups.json");
    this.messages = require("./db/messages.json");
    this.channels = require("./db/channels.json");
    this.images = require("./db/images.json");
    this.nightcores = require("./db/nightcores.json");
    this.beatmaps = require("./db/beatmaps.json");
    this.saveConfig = function(args) {
      switch(args){
        case "groups":
          fs.writeFile("db/groups.json", JSON.stringify(this.groups), function(error) {
            if (error) {
              console.error("write error:  " + error.message);
            }
          });
        break;
        case "messages":
          fs.writeFile("db/messages.json", JSON.stringify(this.messages), function(error) {
            if (error) {
              console.error("write error:  " + error.message);
            }
          });
        break;
        case "channels":
          fs.writeFile("db/channels.json", JSON.stringify(this.channels), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
           });
        break;
        case "nightcores":
          fs.writeFile("db/nightcores.json", JSON.stringify(this.nightcores), function(error) {
              if (error) {
                console.error("write error:  " + error.message);
              }
            });
        break;
        case "beatmaps":
          fs.writeFile("db/beatmaps.json", JSON.stringify(this.beatmaps), function(error) {
              if (error) {
                console.error("write error:  " + error.message);
              }
            });
        break;
      }
    },
    this.isUserInGroup = function (uid, group) {
        if(!this.groups || !this.groups[group]) {
            return false;
        }
        for(var i = 0; i < this.groups[group].length; i++) {
            if(this.groups[group][i] == uid) {
                return true;
            }
        }

        return false;
    }
}

module.exports = database;
