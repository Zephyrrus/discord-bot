var Channer = require("./chan/channer.js")
var chans = {};
var logger = require("winston");
var request = require('request');

/*Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}*/

module.exports = {
    "MODULE_HEADER": {
        moduleName: "Chan module",
        version: "1.0",
        author: "Zephy",
        description: "Gives you cancer",
        setup: initChans
    },
    "4chan": {
        permission: "chan.half",
        helpMessage: "Gives you half cancer",
        category: "Chan",
        handler: doHalf,
        params: [{
            id: "board",
            type: "string",
            required: false
        }, {
            id: "thread",
            type: "string",
            required: false
        }]
    },
    "8chan": {
        permission: "chan.8chan",
        helpMessage: "Gives you full cancer",
        category: "Chan",
        handler: doFull,
        params: [{
            id: "board",
            type: "string",
            required: false
        }, {
            id: "thread",
            type: "string",
            required: false
        }]
    }

};

function initChans() {
    chans.half = new Channer('4chan', function(err, res) {
        if (err) logger.err(err);
        chans.half.init = true;
    });

    chans.full = new Channer('8chan', function(err, res) {
        if (err) logger.err(err);
        chans.full.init = true;
    });
}


function doHalf(e, args) {
    if (!chans.half.init) {
        return e.mention().respond("Sorry, the halfchan parser looks unitiated ;-;")
    }
    doChan(e, args, chans.half);

}

function doFull(e, args) {
    if (!chans.full.init) {
        return e.mention().respond("Sorry, the fullchan parser looks unitiated ;-;")
    }

    doChan(e, args, chans.full);
}

function getRandom(e, board, posts) {
    if (!posts) return e.mention().response("Welp, I fucked up while trying to get an image for you.");
    posts = posts.filter(e => e.tim);
    var random = posts[Math.floor((Math.random() * posts.length))];
    request(board.image(random.tim + random.ext), {
        encoding: null
    }, function(err, res, body) {
        e._disco.bot.uploadFile({
            to: e.channelID,
            file: body,
            filename: "whatever" + random.ext,
            message: "Cancer incoming from **/" + board._board + "/** !"
        });
    });
    //e.mention().respond("Cancer incoming!\n"+board.image(random.tim+random.ext));
}



function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1 / ++count)
            result = prop;
    return result;
}

function doChan(e, args, chan) {

    function _doChanInternal(e, args, chan, repeat) {
        if(repeat > 3) return;

        if (args.board && args.thread) {
            /*var _board = chan.board(args.board);
            if (!_board.Board.sfw && !e.allowNSFW) {
                return e.mention().respond(`**NSFW mode is disabled in the current channel**`);
            }
            _board.thread(args.thread)
                .then(function(res) {
                    getRandom(e, res);
                }).catch(e => {
                    e.mention().respond('I am sorry ;-;.\n**' + e.message + '**');
                });*/
        } else if (args.board && !args.thread) {
            var _board = chan.board(args.board);
            if (_board._Board.sfw == 0 && e.allowNSFW == false) {
                return e.mention().respond(`**NSFW mode is disabled in the current channel**`);
            }
            _board.threads().then(function(res) {
                var threads = [];
                res.forEach(e => {
                    e.threads.forEach(f => {
                        threads.push(f.no);
                    });
                });
                _board.thread(threads[Math.floor((Math.random() * threads.length))]).then(res => {
                    console.log(res[0]);
                    try {
                        getRandom(e, _board, res);
                    } catch (exp) {
                        console.log(exp);
                        _doChanInternal(e, args, chan, ++repeat);
                    }
                });
            }).catch(exp => {
                console.log(exp);
                _doChanInternal(e, args, chan, ++repeat);
            });
        } else {
            var _board = chan.board(pickRandomProperty(e.allowNSFW ? chan._boards : chan.getSFWBoards));
            _board.threads().then(function(res) {
                var threads = [];
                res.forEach(e => {
                    e.threads.forEach(f => {
                        threads.push(f.no);
                    });
                });
                _board.thread(threads[Math.floor((Math.random() * threads.length))]).then(res => {
                    console.log(res[0]);
                    try {
                        getRandom(e, _board, res);
                    } catch (exp) {
                        console.log(exp);
                        _doChanInternal(e, args, chan, ++repeat);
                    }
                });
            }).catch(exp => {
                console.log(exp);
                _doChanInternal(e, args, chan, ++repeat);
            });
        }

    }
    _doChanInternal(e, args, chan, 0);

}