var separators = /;|\|/;
var coins = ["heads", "tails"];

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Helpers module",
        version: "1.0.0",
        author: "Zephy",
        description: "Everything what makes the user's life easier.",
    },
    "flip": {
        helpMessage: "Let the bot choose a random option or flip a coin.",
        category: "Helpers",
        handler: doFlip,
        params: [{
            id: "options",
            type: "string",
            required: false
        }]
    },
    "flipn": {
        helpMessage: "Flips N times and shows you how many times every option was selected",
        permission: "flip.bestof",
        category: "Helpers",
        handler: doflipN,
        params: [{
            id: "number",
            type: "number",
            required: true
        }, {
            id: "options",
            type: "string",
            required: true
        }]
    },
    "discrim": {
        helpMessage: "Searches for users having that discriminator",
        category: "Helpers",
        handler: searchDiscrim,
        params: [{
            id: "number",
            type: "number",
            required: true
        }]
    }
};

function doFlip(e, args) {
    if (args.options) {
        args.options += args._str;
        var flip = args.options.split(separators);
        flip.map(function(s) {
            return s.trim();
        });
        e.respond(flip[Math.floor(Math.random() * flip.length)]);
    } else {
        var side = coins[Math.floor(Math.random() * coins.length)];
        try {
            e.respondFile("images/custom/" + side + ".png", function(error, response) {
                if (error != undefined && error.indexOf("403") > -1) {
                    e.mention().respond("I don't have the permissions to upload files on this channel\nResult after flipping was: **" + side + "**")
                    return;
                }
            });
        } catch (ex) {

        }
    }
}

function doflipN(e, args) {
    if (args.number > 10000 && e._disco.config.general.masterID != e.userID) args.number = 10000;
    args._number = args.number;
    args.options += args._str;
    var flip = args.options.split("|");
    flip.map(function(s) {
        return s.trim();
    });

    var choices = [];
    var maxLength = 0;
    for (var i = 0; i < flip.length; i++) {
        choices[i] = {
            "content": flip[i],
            "hits": 0
        };
        if (choices[i].content.length > maxLength) {
            maxLength = choices[i].content.length;
        }
    }

    var bestOfCounter = 0;
    while (args._number > 0) {
        var random = Math.floor(Math.random() * flip.length);
        choices[random].hits++;
        args._number--;
    }
    choices.sort(function(a, b) {
        return (a.hits > b.hits) ? -1 : ((b.hits > a.hits) ? 1 : 0);
    });

    var result = "**Result of the BO" + args.number + " flipping:**\n\n```\n";
    for (var i = 0; i < flip.length; i++) {
        result += makeSize(choices[i].content, maxLength) + " " + makeProgressBar(choices[i].hits / args.number, 30) + " " + choices[i].hits + "\n";
    }

    result += "```";
    e.mention().respond(result);

}

function searchDiscrim(e, args) {
    var str = "";
    var found = [];
    for (var servernode in e._disco.bot.servers)
        for (var usernode in e._disco.bot.servers[servernode].members)
            if (e._disco.bot.servers[servernode].members[usernode] && e._disco.bot.servers[servernode].members[usernode].user.discriminator == args.number)
                if (found.indexOf(usernode) == -1) {
                    str += usernode + ": " + e._disco.bot.servers[servernode].members[usernode].user.username + "#" + ('0000' + args.number).substr(-4) + "\n";
                    found.push(usernode);
                }
    if (str === "") e.mention().respond("No users found with that discriminator on my servers.");
    else e.mention().respond("Users having that discriminator: \n```\n" + str + "```");
}


makeProgressBar = function(num, max) {
    var a = num * max;
    var str = "";
    for (i = 0; i < max; i++) {
        if (i < a) {
            str += "|";
        } else {
            str += "-";
        }
    }

    return str;
}

makeSize = function(str, len) {
    return str + (new Array(len - str.length + 1)).join(" ");
}