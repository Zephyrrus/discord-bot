var https = require('follow-redirects').https;
var logger = require("winston");

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
            if(res.statusCode != 200) {
                e.mention().respond(`**/r/${args.sub} is not valid**`);
                return;
            }

            try {
                var response = JSON.parse(body);
            } catch(e) {
                e.mention().respond("**Error while parsing the api response**");
                return;
            }

            var posts = [];
            response.data.children.forEach(function(v) {
                v.data.url = v.data.url.replace(/\?.*$/i, ''); // stole this from Zephy
                if(!v.data) { // skip invalid
                    return;
                }
                if(v.data.over_18 && !args.nsfw) {
                    return;
                }
                if(!v.data.over_18 && args.nsfw) return; // return on non-nsfw post when nsfw only is active
                if(/(\.png|\.jpg)$/.test(v.data.url)) {
                    posts.push({
                        url: v.data.url,
                        title: v.data.title,
                        permalink: v.data.permalink
                    });
                }
            });

            if(posts.length === 0) {
                e.mention().respond(`**No suitable posts on /r/${args.sub}**`);
                return;
            }

            var post = posts[Math.floor(Math.random() * posts.length)];
            e.mention().respond(`I am grabbing a random image from **/r/${args.sub}** for you\u2764\n**Title**: ${post.title}\n**Permalink**: <https://reddit.com${post.permalink}>\n${post.url}`);
        });
    }).on('error', function(err) {
        logger.error(`Got error: ${err.message}`);
    });
}
