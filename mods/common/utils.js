var http = require('follow-redirects').http;
var https = require('follow-redirects').https;
var request = require("request");

module.exports = {
  getJSONHTTP: getJSONHTTP,
  getJSONHTTPS: getJSONHTTPS,
  getUptimeString: getUptimeString,
  tm: tm,
  convertMS: convertMS,
  getJson: getJson,
  convertS: convertS
}

function getJSONHTTP(url, callback){
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });
    res.on('end', function(){
        return (callback && callback(null, body));
    });
  }).on('error', function(e){
    return (callback && callback(e, null));
      console.log("[getJson] Got an error: ", {error: e});
  });
}

function getJSONHTTPS(url, callback){
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });
    res.on('end', function(){
        return (callback && callback(null, body));
    });
  }).on('error', function(e){
    return (callback && callback(e, null));
      console.log("[getJson] Got an error: ", {error: e});
  });
}

function getJson(url, callback) {
  var headers = {
      'User-Agent':       'Megu discord bot.',
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: url,
      method: 'GET',
      headers: headers,
      json: true
  }

  request(options, function (err, res, body) {
    if(err) return (callback && callback(err, null));
    if (!err && res.statusCode == 200) {
        return (callback && callback(null, body));
    }
    return (callback && callback("Not 200 response", null));
  });
}

function getUptimeString(startTime) {
  var t = Math.floor((((new Date()).getTime() / 1000) - startTime)) * 1000;
  var uptime = "";
  var d, h, m, s;
  s = Math.floor(t / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  d != 0 ? uptime += d + " days " : null;
  h != 0 ? uptime += h + " hours " : null;
  m != 0 ? uptime += m + " minutes " : null;
  s != 0 ? uptime += s + " seconds " : null;
  /*logger.debug({
    t: t,
    d: d,
    h: h,
    m: m,
    s: s
  });*/
  return uptime;
}

function convertMS(ms){
  return convertS(seconds); // this is cause a naming error in old modules, they send s but I confused then with ms
}
/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 * 
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the the amount of time
 */
function convertS(seconds) {
    var levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 604800), 'weeks'],
        [Math.floor(((seconds % 31536000) % 604800) / 86400), 'days'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
        [((((seconds % 31536000) % 86400) % 3600) % 60).toFixed(2), 'seconds'],
    ];
    var returntext = '';

    for (var i = 0, max = levels.length; i < max; i++) {
        if ( levels[i][0] === 0 ) continue;
        if ( levels[i][0] === 0.00 ) continue;
        returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length-1): levels[i][1]);
    };
    return returntext.trim();
}


function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */ dt;
}


/*
function c(x) {
    var t = [60,60,24,30,1e99];
    var n = ['second', 'minute', 'hour', 'month', 'year'];
    var m = 0;
    var s = '';
    while (x) {
        s = ` ${x % t[m]} ${n[m] + (x % t[m] === 1 ? '' : 's') + s}`;
        x = Math.floor(x / t[m]);
        m++;
    }
    return s.substr(1);
}

function c(x){t=[60,60,24,30,365],n=['second','minute','hour','month','year'],m=0,s='';while(x){s=` ${x%t[m]} ${n[m]+(x%t[m]==1?'':'s')+s}`;x=Math.floor(x/t[m++])}return s.substr(1)}

*/