var databaseStructure = [{
    name: "id",
    type: "autonumber",
    primaryKey: true
}, {
    name: "name",
    type: "string",
    required: true,
    unique: true
}, {
    name: "message",
    type: "string",
    required: true
}, {
    name: "author",
    type: "string",
    required: true
},{
    name: "serverID",
    type: "string",
    required: true
},
{
    name: "addedBy",
    type: "string",
    required: true
},
{
    name: "timestamp",
    type: "string",
    required: true
}];
var database = new(require("../core/Database/databaseHandler.js"))('quote', databaseStructure);

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Quote module",
        version: "1.0.5",
        author: "Zephy",
        description: "Manages per server quotes.",
        start: getQuote
    },
    "quote": {
        helpMessage: "Quotes",
        category: "Misc",
        child: [{
                name: "add",
                handler: addQuote,
                helpMessage: "Add a message to the list of predefined answers.",
                params: [{
                    id: "name",
                    type: "string",
                    required: true
                }, {
                    id: "message",
                    type: "string",
                    required: true
                }]
            },
            { name: "list", handler: listQuote, helpMessage: "Lists all quotes." },
        ]
    }
}


function getQuote(e, callback){
    if(e.message && e.message.charAt(0) == "$"){
        database.find({
            "name": e.message.substr(1).trim(),
            "serverID": e.serverID
        }, function (err, res) {
            if (err) {
                e.logger.error(e.channelID, JSON.stringify(err));
                return callback({message:JSON.stringify(err), silent: true});
            };
            if (res.count > 0) {
                e.respond(`${res.result[0].message.replace("\\n", '\n')} ${res.result[0].author == "Unknown" ? '':'- *' + res.result[0].author + '*'}`);
                callback({silent:true});
            } else{
                callback();  
            }

        });
    }else{
        callback();
    }
}

function listQuote(e, args){
    var result = {};
    var count = 0;
    database.find({
        "serverID": e.serverID
    }, function(err,res){
        if (err) return (e.logger.error(e.channelID, JSON.stringify(err)));
        for (var i = 0; i < res.count; i++) {
            result[res.result[i].name] = {
                "message": res.result[i].message,
                "author": res.result[i].author
            }
        }
        e.mention().respond("Check DM!");
        e.pm("Listing every quote: \n\n```javascript\n" + JSON.stringify(result, null, '\t') + "```");

    });
}

function addQuote(e, args){
    args.name = args.name.toLowerCase();
    args.message += args._str;
    database.find({
        "name": args.name,
        "serverID": e.serverID
    }, function (err, res) {
        if (err) return (e.respond("**WHY DID I CRASH ?** \n```javascript\n" + JSON.stringify(err) + "```"));
        //TODO: REMOVE APPEND, AND USE ADD IN CASE IF ITS APPEND
        if (res.count > 0) {
            e.mention().respond("There's already a quote with this name on the server.");
            return;
        } else {
            var splt = args.message.split("-");
            console.log(splt);
            var author = "Unknown";
            if(splt.length > 1){
                author = splt.pop();
                if(author.length > 32) {
                    message.push(author); 
                    author = "Unknown";
                }// fuck, this was not the author, put it back to it's place
            }
            var message = splt.join("-");

            database.insert({
                "name": args.name,
                "message": message,
                "serverID": e.serverID,
                "addedBy": e.userID,
                "author": author.trim(),
                "timestamp": Date.now()
            }, function (err, res) {
                if (err) return (e.respond("**WHY DID I CRASH ?** \n```javascript\n" + JSON.stringify(err) + "```"));
                e.mention().respond(`Added quote to the database`);
                return;
            });

        } // end database exists counter if
    });
}
