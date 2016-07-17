var https = require('follow-redirects').https;
var logger = require("winston");
var databaseStructure = [
    { name: "id", type: "autonumber", primaryKey: true },
    { name: "name", type: "string", required: true, unique: true },
    { name: "server", type: "string", required: true}
];

var database = new(require("../core/Database/databaseHandler.js"))('reddit', databaseStructure);

module.exports = {
      "MODULE_HEADER":{
        moduleName: "Reddit graber",
        version: "1.1.2",
        author: "Zephy & Windsdon",
        description: "random reddit graber"
      },
      "reddit": {
        permission: "reddit",
        helpMessage: "Grab a random image from the frontpage of this subreddit",
        category: "Entertainment",
        params: [
                {
                    id: "flags",
                    type: "flags",
                    options: {
                        opts: {
                            boolean: true
                        },
                        list: ["nsfw"]
                    }
                },
                {
                    id: "sub",
                    type: "string",
                    required: true
                },
                {
                    id: "nsfw",
                    type: "choice",
                    options: {
                        list: ["nsfw"]
                    },
                    required: false
                }
            ],
        handler: doReddit,
        cooldown: 5000
      },
      "redditadmin": {
        permission: "redditadmin",
        helpMessage: "Admin commands related to the reddit module",
        category: "Entertainment",
        child: [{
            name: "ban",
            handler: banSubreddit,
            helpMessage: "adds a subreddit to the banned subreddit list",
            params: [
                {
                    id: "sub",
                    type: "string",
                    required: true
                }
            ],
        }],
        cooldown: 5000
      }
}

function doReddit(e, args) {
    if(args.flags.nsfw) args.nsfw = true;
    if(!args.sub.match(/^[a-zA-Z0-9_\-]+$/)) {
        e.mention().respond(`**${args.sub} is not a valid subreddit**`);
        return;
    }

    if(args.nsfw && !e.allowNSFW) {
        e.mention().respond(`**NSFW mode is disabled in the current channel**`);
        return;
    }

    database.find([{ "name": args.sub.trim() }], function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        if(res.count > 0){
            return e.mention().respond("This subreddit is part of the global ban list.");
        }
        https.get({
            hostname: "api.reddit.com",
            path: "/r/" + args.sub + "?limit=100",
            headers: {
                "User-Agent": "node:megu-reddit-bot:" + e._disco.version
            }
        }, function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                if (res.statusCode != 200) {
                    e.mention().respond(`**/r/${args.sub} is not valid**`);
                    return;
                }

                try {
                    var response = JSON.parse(body);
                } catch (exp) {
                    e.mention().respond("**Error while parsing the api response**");
                    return;
                }

                var posts = [];
                response.data.children.forEach(function(v) {
                    v.data.url = v.data.url.replace(/\?.*$/i, ''); // stole this from Zephy
                    if (!v.data) { // skip invalid
                        return;
                    }
                    if (v.data.over_18 && !args.nsfw) {
                        return;
                    }
                    if (!v.data.over_18 && args.nsfw) return; // return on non-nsfw post when nsfw only is active
                    if (/(\.png|\.jpg|\.gif|\.gifv)$/.test(v.data.url)) {
                        
                        posts.push({
                            url: v.data.url.replace("gifv", "gif"),
                            title: v.data.title,
                            permalink: v.data.permalink
                        });
                    }
                });

                if (posts.length === 0) {
                    e.mention().respond(`**No suitable posts on /r/${args.sub}**`);
                    return;
                }

                var post = posts[Math.floor(Math.random() * posts.length)];
                e.mention().respond(`I am grabbing a random image from **/r/${args.sub}** for you\u2764\n**Title**: ${post.title}\n**Permalink**: <https://reddit.com${post.permalink}>\n${post.url}`);
            });
        }).on('error', function(err) {
            logger.error(`Got error: ${err.message}`);
        });
    });
}


function banSubreddit(e, args){
    args.sub = args.sub.trim();
    args.sub = args.sub.replace("/r/", '');

    database.add([{ "name": args.sub }, { "server": 0 }], function (err, res) {
        if (err) return (e.printError(e.channelID, err));
        e.mention().respond("Banned subreddit.");
        return;
    });
}