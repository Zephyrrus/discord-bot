var path = require('path');
var qs = require('querystring');
var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded());

function webModule(o) {
  /*if (!(this instanceof Square)) {
    return new Square(width);
  }*/
  this.bot = o.bot;
  this.o = o;
};

webModule.prototype.initializeModule = function initializeModule() {
  //return Math.pow(this.width, 2);
};

module.exports = webModule;

app.use(function(req, res, next) { // matches all requests
    console.log((req.method+'       ').substr(0,8) + req.url); // do stuff like logging
    next(); // goes to the thingy below
});

app.get('/', function(req, res) {
    console.log("Cookies: ", req.cookies)
    var rnd=Math.random().toString();
    rnd=rnd.substring(2,rnd.length);
    res.cookie('botCookies',rnd, { maxAge: 900000, httpOnly: true });
    var index = "index.jade";
    res.render(index);
});

app.use('/res', express.static(path.join(__dirname, 'res')));

app.use(function(err, req, res, next) {
    console.error(err);
    req.status(500).json({
        status: 'internal_error',
        comment: 'Something went wrong, or whatever'
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


/*app.get('/postmessage', function(req, res){
  if (!req.query.message || req.query.message.length === 0) {
    return res.status(400).json({
      status: 'missing message'
    });
  }
  if (!req.query.id || req.query.id.length === 0) {
    return res.status(400).json({
      status: 'missing channel id'
    });
  }
  o.bot.sendMessage({
    to: req.query.id,
    message: req.query.message
  }, function(response){
    return res.status(200).json({
        response: response,
      });
  });
})*/

app.get('/status', function(req, res){
  if(!o){
    return res.status(200).json({
       status: "offline"
     });
  }
  if (req.query.all) {
    return res.status(200).json({
       status: "online",
       botinfo: o.bot.servers,
       startTime: o.botStatus.startTime,
       cooldown: o.botStatus.cooldown,
       nsfwFilter: o.botStatus.nsfwFilter,
       uptime: Math.floor((((new Date()).getTime() / 1000) - o.botStatus.startTime))
     });
  }
   res.status(200).json({
      status: "online",
      startTime: o.botStatus.startTime,
      cooldown: o.botStatus.cooldown,
      nsfwFilter: o.botStatus.nsfwFilter,
      uptime: Math.floor((((new Date()).getTime() / 1000) - o.botStatus.startTime))
    });
});

app.listen(8080, function () { // moved to 8080
  console.log('App listening on port 8080');
})
