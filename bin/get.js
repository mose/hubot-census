'use strict';

var request = require("request");
var qs = require('querystring');
var path = require('path');
var fs = require("fs");

// const storedir = 'docs/data/';
const storedir = 'tmp/';

var getList = function (key) {
  let filename = storedir + key + '.json';
  fs.stat(filename, function(err, stat) {
    if (err !== null) {
      uri = 'https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?' + 
        qs.stringify(
          {
            startkey: '["' + key + '"]',
            endkey: '["' + key + ',{}"]',
            group_level: 3
          }
        )
      request(uri).pipe(fs.createWriteStream(storedir + key + '.json'));
    }
  })
  return(JSON.parse(fs.readFileSync(filename, 'utf8')));
}

let hubot = getList('hubot');
console.log(hubot);
