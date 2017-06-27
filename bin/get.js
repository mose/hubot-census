'use strict';

const request = require("request");
const qs = require('querystring');
const util = require('util');
const path = require('path');
const fs = require("fs");

// const storedir = 'docs/data/';
const storedir = 'tmp/';

const getList = function (key) {
  const filename = storedir + key + '.json';
  return new Promise( (res, err) => {
    fs.stat(filename, function(err, stat) {
      if (err !== null) {
        const uri = 'https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?' + 
          qs.stringify(
            {
              startkey: '["' + key + '"]',
              endkey: '["' + key + ',{}"]',
              group_level: 3
            }
          )
        request(uri, function(error, response, body) {
          fs.writeFileSync(filename, body);
          res(JSON.parse(body));
        });
      } else {
        res(JSON.parse(fs.readFileSync(filename, 'utf8')));
      }  
    });
  });
}

const getDep = function(key) {
  const filename = storedir + key + '.dep.json';
  return new Promise( (res, err) => {
    fs.stat(filename, function(err, stat) {
      if (err !== null) {
        const uri = 'https://skimdb.npmjs.com/registry/_design/app/_view/dependentVersions?' + 
          qs.stringify(
            {
              startkey: '["' + key + '"]',
              endkey: '["' + key + ',{}"]',
              reduce: 'false'
            }
          )
        request(uri, function(error, response, body) {
          fs.writeFileSync(filename, body);
          res(JSON.parse(body));
        });
      } else {
        res(JSON.parse(fs.readFileSync(filename, 'utf8')));
      }
    });
  });
}

Promise.all([
  getList('hubot'),
  getDep('hubot')
]).then((data) => {
  const hubot = data[0].rows.map(function(i) { return i.key[1] });
  const hubotdep = data[1].rows.map(function(i) { return i.id });
  
  console.log(util.inspect(hubotdep, { depth: 1 }));
});
