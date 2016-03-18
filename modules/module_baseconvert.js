module.exports = {
  properties: {
    "module": true,
    "info": {
      "description": "converts between different bases",
      "author": "Zephy",
      "version": "1.0.1",
      "importance": "addon",
      "name": "Base converter",
      "moduleName": "baseconvert"
    },
    "requiresDB": false,
  },
  lastTime: 0,
  cooldown: 1000,
  category: "misc",
  description: "convert <bin2dec/bin2hex/dec2bin/dec2hex/hex2bin/hex2dec> <message> - convert the input to the specified base",
  permission: {
    onlyMonitored: true
  },
  action: function(args, e) {
    convert(e, args)
  }
};

function convert(e, args) {
    try {
        e.bot.sendMessage({
          to: e.channelID,
          message: "<@" + e.userID + "> \nResult of **" + args[0] + "** conversion is: \n```" + (ConvertBase[args[0]](args[1])) + "```"
        });
    } catch(err) {
      e.bot.sendMessage({
        to: e.channelID,
        message: "<@" + e.userID + "> Can't convert between bases, invalid parameters received."
      });
    }
}


(function(){
    var ConvertBase = function (num) {
        return {
            from : function (baseFrom) {
                return {
                    to : function (baseTo) {
                        return parseInt(num, baseFrom).toString(baseTo);
                    }
                };
            }
        };
    };

    // binary to decimal
    ConvertBase.bin2dec = function (num) {
        return ConvertBase(num).from(2).to(10);
    };

    // binary to hexadecimal
    ConvertBase.bin2hex = function (num) {
        return ConvertBase(num).from(2).to(16);
    };

    // decimal to binary
    ConvertBase.dec2bin = function (num) {
        return ConvertBase(num).from(10).to(2);
    };

    // decimal to hexadecimal
    ConvertBase.dec2hex = function (num) {
        return ConvertBase(num).from(10).to(16);
    };

    // hexadecimal to binary
    ConvertBase.hex2bin = function (num) {
        return ConvertBase(num).from(16).to(2);
    };

    // hexadecimal to decimal
    ConvertBase.hex2dec = function (num) {
        return ConvertBase(num).from(16).to(10);
    };

    this.ConvertBase = ConvertBase;

})(this);
