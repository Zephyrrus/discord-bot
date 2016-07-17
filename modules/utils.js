var http = require('follow-redirects').http;
var https = require('follow-redirects').https;

module.exports = {
  getJSONHTTP: getJSONHTTP,
  getJSONHTTPS: getJSONHTTPS,
  getUptimeString: getUptimeString,
  tm: tm,
  convertMS: convertMS
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

function convertMS(ms) {
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return {
    d: d,
    h: h,
    m: m,
    s: s
  };
}

function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */ dt;
}
