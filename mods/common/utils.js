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
  convertS: convertS,
  EmbedGenerator: EmbedGenerator
}

function getJSONHTTP(url, callback) {
  http.get(url, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      return (callback && callback(null, body));
    });
  }).on('error', function(e) {
    return (callback && callback(e, null));
    console.log("[getJson] Got an error: ", {
      error: e
    });
  });
}

function getJSONHTTPS(url, callback) {
  http.get(url, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      return (callback && callback(null, body));
    });
  }).on('error', function(e) {
    return (callback && callback(e, null));
    console.log("[getJson] Got an error: ", {
      error: e
    });
  });
}

function getJson(url, callback) {
  var headers = {
    'User-Agent': 'Megu discord bot.',
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
    url: url,
    method: 'GET',
    headers: headers,
    json: true
  }

  request(options, function(err, res, body) {
    if (err) return (callback && callback(err, null));
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

function convertMS(ms) {
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
    if (levels[i][0] === 0) continue;
    if (levels[i][0] === 0.00) continue;
    returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
  };
  return returntext.trim();
}


function tm(unix_tm) {
  var dt = new Date(unix_tm * 1000);
  return /*dt.getHours() + '/' + dt.getMinutes() + '/' + dt.getSeconds() + ' -- ' + */ dt;
}

function EmbedGenerator(title, description, url, timestamp, color) {
  this._title = title;
  this._description = description;
  this._url = url;
  this._timestamp = timestamp;
  this._color = color;
  this._fields = [];
  this._thumb = undefined;
  this._author = undefined;
  this._footer = undefined;
  var self = this;

  Object.defineProperty(this, "title", {
    get: function() {
      return this._title;
    },
    set: function(value) {
      this._title = value;
    }
  });

  Object.defineProperty(this, "description", {
    get: function() {
      return this._description;
    },
    set: function(value) {
      this._description = value;
    }
  });

  Object.defineProperty(this, "url", {
    get: function() {
      return this._url;
    },
    set: function(value) {
      this._url = value;
    }
  });

  Object.defineProperty(this, "color", {
    get: function() {
      return this._color;
    },
    set: function(value) {
      this._color = color;
    }
  });

  Object.defineProperty(this, "timestamp", {
    get: function() {
      return this._timestamp;
    },
    set: function(value) {
      this._timestamp = value;
    }
  });
}

EmbedGenerator.prototype.addField = function(name, value, inline) {
  value = value || "None";
  inline = inline || false;

  if (typeof(name) != 'string' || typeof(value) != 'string') {
    return this;
  }
  if (name == "") return this;
  if (inline && typeof(inline) != 'boolean')
    inline = false;

  this._fields.push({
    'name': name,
    'value': value,
    'inline': inline
  });
  return this;
};

EmbedGenerator.prototype.setThumb = function(url, width, height) {
  if (typeof(url) != 'string') {
    return this;
  }
  width = width || 0;
  height = height || 0;
  this._thumb = {
    url: url,
    width: width,
    height: height
  };
  return this;
};

EmbedGenerator.prototype.setAuthor = function(name, url, icon_url) {
  if (typeof(name) != 'string') {
    return this;
  }
  this._author = {
    name: name,
    url: url,
    icon_url: icon_url
  };
  return this;
};

EmbedGenerator.prototype.setFooter = function(text, icon_url) {
  if (typeof(text) != 'string') {
    return this;
  }
  this._footer = {
    text: text,
    icon_url: icon_url
  };
  return this;
};

EmbedGenerator.prototype.create = function(){
  return {
    type: 'rich',
    title: this._title,
    description: this._description,
    fields: this._fields,
    author: this._author,
    footer: this._footer
  };
};

EmbedGenerator.prototype.generate = function(){
  return this.create();
};

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