var fs = require("fs");

function database() {
    this.groups = require("./db/groups.json");
    this.messages = require("./db/messages.json");
    this.channels = require("./db/channels.json");
    //this.passes = require("./db/pass.json");
    this.images = require("./db/images.json");
    this.nightcores = require("./db/nightcores.json")

    this.saveConfig = function() {
        fs.writeFile("db/groups.json", JSON.stringify(this.groups), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
        });

        fs.writeFile("db/messages.json", JSON.stringify(this.messages), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
        });

        fs.writeFile("db/channels.json", JSON.stringify(this.channels), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
        });

        /*fs.writeFile("db/images.json", JSON.stringify(this.images), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
        });*/

        fs.writeFile("db/nightcores.json", JSON.stringify(this.nightcores), function(error) {
             if (error) {
               console.error("write error:  " + error.message);
             }
        });
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
