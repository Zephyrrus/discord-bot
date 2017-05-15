var path = require('path');
var qs = require('querystring');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require("winston");
var app = express();
/* global o */
var keyHandler = require('./webKeyHandler.js');
var databaseUtils = require('../database/databaseUtils.js');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

function webModule(_disco) {
  logger.info("Initializing web module");
  this.bot = _disco.botInstance;
  this._disco = _disco;
}

webModule.prototype.initializeModule = function initializeModule() {
  //return Math.pow(this.width, 2);
};

module.exports = webModule;

app.use(function (req, res, next) { // matches all requests
  console.log((req.method + '       ').substr(0, 8) + req.url); // do stuff like logging
  next(); // goes to the thingy below
});

app.use('/res', express.static(path.join(__dirname, 'res')));

app.get('/', function (req, res) {
  /*console.log("Cookies: ", req.cookies);
  var rnd=Math.random().toString();
  rnd=rnd.substring(2,rnd.length);
  res.cookie('botCookies',rnd, { maxAge: 900000, httpOnly: true });
  var index = "index.jade";
  res.render(index);*/
  res.status(404).json({
    status: "not_found"
  });
});




app.post('/', function (req, res) {
  var body = '';
  req.on('data', function (data) {
    body += data;
    // Too much POST data, kill the connection!
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6)
      req.connection.destroy();
  });
  req.on('end', function () {
    var post = qs.parse(body);
    console.log(post);
    // use post['blah'], etc.
    res.send();
  });
});


app.get('/postmessage', function (req, res) {
  /*if (!req.query.message || req.query.message.length === 0) {
    return res.status(400).json({
      status: 'missing message'
    });
  }
  if (!req.query.id || req.query.id.length === 0) {
    return res.status(400).json({
      status: 'missing channel id'
    });
  }
  if(req.query.key === "TUUt6!xsfk1Yw86Xb2QXJup9OLULkw")
  o.bot.sendMessage({
    to: req.query.id,
    message: req.query.message
  }, function(response){
    return res.status(200).json({
        response: response,
      });
  });*/
  res.status(200).json({
    response: "command disabled until api keys are implemented"
  });
})

app.get('/status', function (req, res) {
  if (!_disco) {
    return res.status(200).json({
      status: "offline"
    });
  }
  if (req.query.all) {
    return res.status(200).json({
      status: "online",
      botinfo: _disco.bot.servers,
      startTime: _disco.botStatus.startTime,
      cooldown: _disco.botStatus.cooldown,
      nsfwFilter: _disco.botStatus.nsfwFilter,
      uptime: Math.floor((((new Date()).getTime() / 1000) - _disco.botStatus.startTime))
    });
  }
  res.status(200).json({
    status: "online",
    startTime: _disco.botStatus.startTime,
    cooldown: _disco.botStatus.cooldown,
    nsfwFilter: _disco.botStatus.nsfwFilter,
    uptime: Math.floor((((new Date()).getTime() / 1000) - _disco.botStatus.startTime))
  });
});

app.get('/database', function (req, res) {
  var tables = ["nightcore", "ban", "osu", "reminder", "rank"];

  if (!req.query.name || req.query.name.length === 0) {
    return res.status(400).json({
      response: {
        status: 'missing_database_name'
      }
    });
  }
  if (tables.indexOf(req.query.name) < 0) {
    return res.status(404).json({
      response: {
        status: 'invalid database name'
      }
    });
  }

  if (keyHandler.validateKey() == 0) {
    _disco.bot.sendMessage({
      to: "143863604205060096",
      message: "endpoint /database with params `" + JSON.stringify(req.query) + "` used."
    })
    databaseUtils.list(req.query.name, function(err, resp){
      if(err) return res.status(500).json({
        response: {
          status: err
        }
      });

      res.status(200).json({
        response: {
          status: "online",
          database: resp
        }
      });
    });

  }
});

app.get('/solve', function (req, res) {
  res.status(200).json({
    response: {
      status: "in bed with opl",
      response: "opl is a faggot"
    }
  });
});

app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).json({
    status: 'internal_server_error'
  });
  throw err;
});

app.listen(8089, "0.0.0.0", function () { // moved to 8080
  console.log("App listening on " + "0.0.0.0" + ":" + "8089");
})
