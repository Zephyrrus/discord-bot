module.exports = {
  "MODULE_HEADER":{
    moduleName: "Helpers module",
    version: "1.0.0",
    author: "Zephy",
    description: "Everything what makes the user's life easier.",
  },
  "flip": {
    helpMessage: "Let the bot choose a random option",
    category: "Helpers",
    handler: doFlip,
    params: [{
        id: "options",
        type: "string",
        required: true
    }]
  },
  "flipn": {
    helpMessage: "Flips N times and shows you how many times every option was selected",
    category: "Helpers",
    handler: doflipN,
    params: [{
        id: "number",
        type: "string",
        required: true
    },{
        id: "options",
        type: "string",
        required: true
    }]
  }
}

function doFlip(e, args){
  args.options += args._str;
  var flip = args.options.split("|");
  flip.map(function(s) { return s.trim() });
  e.respond(flip[Math.floor(Math.random() * flip.length)]);
}

function doflipN(e, args){
  if(args.number > 10000 && e.config.general.masterID != e.userID) args.number = 10000;
  args._number = args.number;
  args.options += args._str;
  var flip = args.options.split("|");
  flip.map(function(s) { return s.trim() });

  var choices = [];
  var maxLength = 0;
  for(var i = 0; i < flip.length; i++){
      choices[i] = {"content": flip[i], "hits": 0};
      if(choices[i].content.length > maxLength) {
          maxLength = choices[i].content.length;
      }
  }

  var bestOfCounter = 0;
  while(args._number > 0){
    var random = Math.floor(Math.random() * flip.length);
    choices[random].hits++;
    args._number--;
  }
  choices.sort(function(a,b) {return (a.hits > b.hits) ? -1 : ((b.hits > a.hits) ? 1 : 0);});

  var result = "**Result of the BO" + args.number + " flipping:**\n\n```\n";
  for(var i = 0; i < flip.length; i++){
    result += makeSize(choices[i].content, maxLength) + " " + makeProgressBar(choices[i].hits/args.number, 30) + " " + choices[i].hits + "\n";
  }

  result += "```";
  e.mention().respond(result)

}



makeProgressBar = function(num, max) {
    var a = num * max;
    var str = "";
    for(i = 0; i < max; i++) {
        if(i < a) {
            str += "|";
        } else {
            str += "-";
        }
    }

    return str;
}

makeSize = function(str, len) {
  return  str + (new Array(len - str.length + 1)).join(" ");
}
