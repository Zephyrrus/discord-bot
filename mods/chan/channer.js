 "use strict";

 var request = require('request');
 var htmlToText = require('html-to-text');

 /*Promise.onPossiblyUnhandledRejection(function(error){
     throw error;
 });*/

 var requestOptions = {
     json: true,
     headers: {
         'if-modified-since': (new Date()).toUTCString(),
         'user-agent': 'node:megu:v1.9'
     }
 };

 class Channer {
     constructor(chan, callback) {
         this._chan = chan;
         if (!chans[this._chan]) throw new Error("Unsupported chan");
         this.chan = chans[this._chan];
         var self = this;
         this.boards().then(res => {
                 self._boards = self.chan.boardsParser(res);
                 callback(null, self._board);
             })
             .catch(err => {
                 return callback(err);
             });
     }

     boards() {
         var uri = [this.chan.baseUrl, "boards.json"].join("/");

         return new Promise((resolve, reject) => {
             request(uri, requestOptions, function(err, res, body) {
                 if (err) reject(err);
                 resolve(body);
             });
         });

     }

     board(board) {
         var _board = /^\/?(\w+)\/?$/g.exec(board);
         if (_board && _board[1]) board = _board[1];
         if (!this._boards[board]) throw new Error("No board ("+ board +") with that name on this chan");
         return new Board(this.chan, board, this._boards[board]);
     }

     get getBoards() {
         return this._boards;
     }

     get getSFWBoards() {
         console.log("!");
         var result = {};
         for (var board in this._boards)
             if (this._boards[board].sfw == 1)
                 result[board] = this._boards[board];
            //console.log(result);
         return result;
     }
 }

 class Board {
     constructor(chan, board, Board) {
         this._board = board;
         this._chan = chan;
         this._Board = Board;
     }

     image(file) {
         return [this._chan.picUrl, this._board, this._chan.picSrc, file].join("/");
     }

     catalog() {
         return new Promise((resolve, reject) => {
             var uri = [this._chan.baseUrl, this._board, "catalog.json"].join("/");

             request(uri, requestOptions, function(err, res, body) {
                 if (err) return reject(err);
                 resolve(body);
             });

         });
     }

     threads() {
         return new Promise((resolve, reject) => {
             var uri = [this._chan.baseUrl, this._board, "threads.json"].join("/");

             request(uri, requestOptions, function(err, res, body) {
                 if (err) return reject(err);
                 resolve(body);
             });

         });
     }

     page(num) {
         return new Promise((resolve, reject) => {
             var uri = [this._chan.baseUrl, this._board, num + ".json"].join("/");

             request(uri, requestOptions, function(err, res, body) {
                 if (err) return reject(err);
                 resolve(body);
             });
         });
     }

     thread(id) {
         return new Promise((resolve, reject) => {
             var uri = [this._chan.baseUrl, this._board, this._chan.del, id + ".json"].join("/");
             request(uri, requestOptions, function(err, res, body) {
                 if (err) return reject(err);
                 if (!body) return reject(new Error("No thread with that id"));
                 body.posts.forEach(e => {
                     e.com = htmlToText.fromString(e.com, {
                         wordwrap: false
                     })
                 });
                 resolve(body.posts);
             });
         });
     }
 }

 var chans = {
     '4chan': {
         alias: '4chan',
         templateUrl: 'http://boards.4chan.org/%s/thread/%s',
         regEx: /^http:\/\/boards\.4chan\.org\/(\w)+\/thread\/(\d)+/,
         baseUrl: 'http://a.4cdn.org', // apiurl
         del: 'thread',
         picUrl: 'http://i.4cdn.org',
         picSrc: 'src',
         boardsParser: function(boardJSON) {
             var parsed = {};
             boardJSON.boards.forEach(e => {
                 parsed[e.board] = {
                     title: e.title,
                     description: decodeHTMLEntities(e.description),
                     sfw: e.ws_board,
                     pages: e.pages,
                     perPage: e.per_page,
                     maxFilesize: e.max_filesize,
                     maxWebmDuration: e.max_webm_duration,
                     bumpLimit: e.bump_limit,
                     imageLimit: e.image_limit,
                     cooldowns: e.cooldowns,
                     isArchived: e.is_archived,
                     locale: 'english'
                 };
             });
             return parsed;
         }
     },
     '8chan': {
         alias: '8chan',
         templateUrl: 'https://8ch.net/%s/res/%s.html',
         regEx: /^https:\/\/8ch\.net\/(\w)+\/res\/(\d+)\.html.*/,
         baseUrl: 'https://8ch.net',
         del: 'res',
         picUrl: 'https://8ch.net',
         picSrc: 'src',
         boardsParser: function(boardJSON) {
             var parsed = {};
             boardJSON.forEach(e => {
                 parsed[e.uri] = {
                     title: e.title,
                     description: decodeHTMLEntities(e.subtitle),
                     sfw: e.sfw,
                     tags: e.tags,
                     locale: e.locale
                 };
             });
             return parsed;
         }
     }
 };

 function decodeHTMLEntities(text) {
     if (!text) return;
     var entities = [
         //['apos', '\''],
         ['&amp;', '&'],
         ['&lt;', '<'],
         ['&gt;', '>'],
         ['&quot;', '"']
     ];

     for (var i = 0, max = entities.length; i < max; ++i)
         text = text.replace(new RegExp(entities[i][0], 'g'), entities[i][1]);

     return text;
 }

 module.exports = Channer;