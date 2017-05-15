var request = require('request');
var generated = [];
module.exports = {
    "MODULE_HEADER": {
        moduleName: "Word cloud commands",
        version: "1.0.0",
        author: "Zephy",
        description: "Word cloud commands",
    },
    "cloudy": {
        permission: "cloudy",
        helpMessage: "cloudy!",
        category: "Info",
        handler: tryCloud,
        cooldown: 3600000,
        params: [{
            id: "channelID",
            type: "string",
            required: false
        }, {
            id: "filterN",
            type: "number",
            required: false
        }, {
            id: "timelimit",
            type: "number",
            required: false
        }],
    },
    "godcloudy": {
        permission: "godcloudy",
        helpMessage: "cloudy!",
        category: "Info",
        handler: doGodCloud,
        cooldown: 3600000,
        params: [{
            id: "channelID",
            type: "string",
            required: false
        }, {
            id: "filterN",
            type: "number",
            required: false
        }],
    },
    "thunder": {
        permission: "thunder",
        helpMessage: "cloudy!",
        category: "Admin",
        handler: thunder,
    }
};

function thunder(e, args) {
    generated = [];
    e.mention().respond("Reseted global limits");
}

function doCanvas(sortedList, limit, callback) {
    var Canvas = require('canvas');
    limit = limit || 100;
    var size = [1920, 1080];
    var cloud = require("d3-cloud");
    var words = [];
    var clamp = new Clamper(sortedList[sortedList.length - 1][1], sortedList[0][1]);

    for (var i = 0; i < (limit > sortedList.length ? sortedList.length : limit); i++) {
        words.push({
            text: sortedList[i][0],
            size: (10 + (clamp.normalize(sortedList[i][1]) * 80))
        });
    }

    var rotations = [];
    rotations.push(getAngle(), getAngle(), getAngle(), 0);


    var layout = cloud().size(size)
        .canvas(function() {
            return new Canvas(1, 1);
        })
        .words(words)
        .padding(5)
        .rotate(function() {
            //return~~ (Math.random() * 2) * 90;
            return rotations[Math.floor(Math.random() * rotations.length)];
        })
        .spiral("archimedean")
        .font("Impact")
        .fontSize(function(d) {
            return d.size;
        })
        .on("end", end);

    layout.start();


    function end(words) {
        var fs = require('fs');
        var svg = new svgRender(size[0], size[1]);

        svg.append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")");

        /*points = new Points(words.length);
  		point = null;
  		_results = [];*/

        words.forEach(function(e) {
            /*point = points.pick(point);
    		_ref = RYB.rgb.apply(RYB, point).map(function(x) {
      			return Math.floor(255 * x);
    		}), r = _ref[0], g = _ref[1], b = _ref[2];
    		color = "rgb(" + r + ", " + g + ", " + b + ")";*/
            svg.append("text")
                .style("font-size", e.size + "px")
                .style("font-family", "Impact")
                .style("fill", getColor())
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + [e.x, e.y] + ")rotate(" + e.rotate + ")")
                .applyStyle()
                .end(e.text);
        });
        svg.end();
        return callback(null, svg.save());
        //writeFile(svg.save(), "svg");
    }
}


/* minimal XML generator */
function svgRender(width, height) {
    this.width = width;
    this.height = height;
    this.svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    this._style = "";
    this.currentTag = [];
}

svgRender.prototype.append = function(tag) {
    var indent = "\t";
    for (var i = 0; i < this.currentTag.length; i++) {
        indent += "\t";
    }

    if (tag) {
        this.currentTag.push(tag);
        this.svg += `${indent}<${tag} >\n`;
    }
    return this;
};

svgRender.prototype.attr = function(attribute, value) {
    if (this.currentTag.length == 0) return this;
    this.svg = this.svg.substring(0, this.svg.length - 2); // pop the >
    this.svg += `${attribute}="${value}" >\n`;

    return this;
};

svgRender.prototype.applyStyle = function() {
    if (this.currentTag.length == 0) return this;
    this.svg = this.svg.substring(0, this.svg.length - 2); // pop the >
    this.svg += `style="${this._style}" >\n`;
    this._style = "";
    return this;
};

svgRender.prototype.style = function(attribute, value) {
    this._style += `${attribute}:${value}; `;
    return this;
};

svgRender.prototype.end = function(text) {
    var indent = "";
    for (var i = 0; i < this.currentTag.length; i++) {
        indent += "\t";
    }
    if (this.currentTag.length == 0) return this;

    if (text) {
        text = encodeHTMLEntities(text);
        this.svg = this.svg.substring(0, this.svg.length - 1); // pop the \n
        this.svg += `${text}`;
        this.svg += `</${this.currentTag[this.currentTag.length-1]}>\n`;
        this.currentTag.pop();
        return this;
    }
    this.svg += `${indent}</${this.currentTag[this.currentTag.length-1]}>\n`;
    return this;
};

svgRender.prototype.save = function() {
    return (this.svg += "</svg>");
};

/* HTML ENCODER */
function encodeHTMLEntities(text) {
    var entities = [
        //['apos', '\''],
        ['amp', '&'],
        ['lt', '<'],
        ['gt', '>'],
        ['quot', '"']
    ];

    for (var i = 0, max = entities.length; i < max; ++i)
        text = text.replace(new RegExp(entities[i][1], 'g'), '&' + entities[i][0] + ';');

    return text;
}

/* UTILS */
function sortIt(unsortable, trash) {
    trash = trash || 0;
    var sortable = [];
    var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

    for (var element in unsortable) {
        if (!(element.length < trash) && !stopWords.test(element.toLowerCase()) && (element.indexOf("<") == -1 && element.indexOf(">") == -1) && element.indexOf("http") == -1)
            sortable.push([element, unsortable[element]]);
    }

    sortable.sort(function(a, b) {
        return b[1] - a[1];
    }); //reverse sort, fuk u all
    return sortable;
}

function getAngle() {
    //Math.floor((Math.random()*180-90)/22.5)*22.5;
    return Math.floor(Math.random() * 7 - 3) * 22.5;
}

function getColor() {
    //var colors = ['f1c40f','3498db','00c61f','d7ae00','d76a00','e92f07','2746f2','05ba9a','f665e5','e32c4c', '6B6ECF', '637939', 'E7BA52', 'AD494A', 'DE9ED6'];
    var colors = ['3FB8AF', '7FC7AF', 'DAD8A7', 'FF9E9D', 'FF3D7F', '655643', '80BCA3', 'E6AC27', 'BF4D28', 'CCA9D1'];
    return '#' + colors[Math.floor(Math.random() * colors.length)];
}

var elapsed_time = function(note) {
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
    start = process.hrtime(); // reset the timer
};

function writeFile(content, extension) {
    extension = extension || "txt";
    var fs = require('fs');
    if (typeof content == "object") content = JSON.stringify(content, null, '\t');
    fs.writeFile("dump." + extension, content, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

function Clamper(min, max) {
    //count / max(count) * 80 + 10
    this.min = min;
    this.max = max;

    this.normalize = function(x) {
        return ((x - this.min) / (this.max - this.min));
    };

    //return this;
}

function getMessages(e, channelID, genAll, timelimit, cb) {
    var counter = {};
    var maxTime = Date.now() - timelimit;

    function remove(before, count, callback) {
        request({
            url: "https://discordapp.com/api/channels/" + channelID + "/messages?limit=" + count + (before ? "&before=" + before : ''),
            headers: {
                authorization: e._disco.bot.internals.token
            }
        }, function(err, response, body) {
            if (err) {
                callback(err);
                return;
            }

            var data = JSON.parse(body);
            console.log('called with', before);
            var last = null;

            if (data.length != 0) {
                for (var i = 0; i < data.length; i++) {
                    var timestamp = Math.floor(new Date(Date.parse(data[i].timestamp)));
                    if (!genAll && timestamp < maxTime) return callback(null, counter, null);;
                    //console.log(data[i].content);
                    data[i].content.toLowerCase().split(" ").forEach(function(e) {
                        e = e.trim();
                        if (e == "") return;
                        e = e.replace(/(\*\*|\*|__|\~\~)/gi, "");
                        if (counter[e]) counter[e] += 1;
                        else counter[e] = 1;
                    });
                }
                callback(null, data, data[data.length - 1].id);
            } else {
                callback(null, counter, null);
            }
        });
    }


    function removeMore(before, count, callback) {
        var limit = count > 100 ? 100 : count;
        remove(before, limit, function(err, data, last) {
            if (err || !data) {
                callback(err);
            }

            if (count - limit <= 0) {
                callback(err, data, last);
            } else {
                removeMore(err, count - limit, callback);
            }
        });
    }

    function iterate(err, data, last) {
        if (err) {
            e.code(err.message).respond();
            cb(err, null);
            return;
        }
        if (last) {
            removeMore(last, 100, iterate);
        } else {
            return cb && cb(null, counter);
        }
    }
    e.respond(`Generating cloudy for channel \`${channelID}\`, please wait. (it can take up to 2 minutes for me to render it)`);
    removeMore(undefined, 100, iterate);
}


function doGodCloud(e, args) {
    args.genAll = true;
    tryCloud(e, args);
}

function tryCloud(e, args) {
    var start = process.hrtime();
    var minLen = 4; // filters out with len 0-3
    var timeLimit = args.timelimit || 86400000;
    args.channelID = args.channelID || e.channelID;

    if (generated[args.channelID] && (Date.now() - generated[args.channelID].timestamp) < 21600000) {
        e.mention().respond("Can't generate cloud for this channel because there was one already generated in the last 6h");
        return;
    }
    generated[args.channelID] = {};
    generated[args.channelID].timestamp = Date.now();

    if (args.filterN && !isNaN(args.filterN)) {
        minLen = args.filterN || 4;
    }

    try {
        getMessages(e, args.channelID, args.genAll, timeLimit, function(err, res) {
            if (err) return (e.mention().respond("Can't generate a cloud."));
            var sorted = sortIt(res, minLen);
            doCanvas(sorted, 2000, function(err, res) {
                var formData = {
                    raindrop: e._disco.config.cloud.rain,
                    //upfile:
                    upfile: {
                        value: res + `<!-- {channelID:'${e.channelID}', serverID:'${e.serverID}', timestamp:'${Date.now()}', userID:'${e.userID}' } -->\n<!-- ${JSON.stringify(sorted).replace(/\-\-/g, '&#x002D;&#x002D;')} -->`,
                        options: {
                            filename: 'thing.svg',
                            contentType: 'image/svg+xml'
                        }
                    }
                };
                request.post({
                    url: e._disco.config.cloud.backend,
                    formData: formData
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        generated[args.channelID].timestamp = 0;
                        e.logger.error(err);
                        return e.mention().respond("Failed generating word cloud, can't connect to backend!");
                    }
                    try {
                        var response = JSON.parse(body);
                        if (response.status == "success")
                            e.mention().respond("Finished generating word cloud.\nYou can find it at http://zephy.xyz/cloud/" + response.fileName + "." + response.ext + ".\nIt took me **" + elapsed_time(start) + "** to generate it for you\nFiltered out every word with len < **" + minLen + "**");
                        else {
                            e.mention().respond("Failed uploading cloud to back-end!");
                            e.logger.error(response);
                            generated[args.channelID].timestamp = 0;
                        }
                    } catch (e) {
                        e.mention().respond("Failed generating word cloud, back-end returned invalid data!");
                        return;
                    }

                });
            });

        });
    } catch (ex) {
        return e.mention().respond("Failed generating word cloud, make sure the id was correct!");
    }
}


var elapsed_time = function(startTime, note) {
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(startTime)[1] / 1000000; // divide by a million to get nano to milli
    return (process.hrtime(startTime)[0] + " s, " + elapsed.toFixed(precision) + " ms" + (note ? " - " + note : "")); // print message + time
    startTime = process.hrtime(); // reset the timer
};