'use strict';

const request = require("request");
const qs = require('querystring');
const util = require('util');
const path = require('path');
const fs = require("fs");

const storedir = 'docs/data/';
// const storedir = 'tmp/';
const refresh = (process.argv[2] === 'refresh');

const getList = function (key, refresh) {
  const filename = storedir + key + '.json';
  return new Promise( (res, err) => {
    fs.stat(filename, function(err, stat) {
      if (refresh || err !== null) {
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

const getDep = function(key, refresh) {
  const filename = storedir + key + '.dep.json';
  return new Promise( (res, err) => {
    fs.stat(filename, function(err, stat) {
      if (refresh || err !== null) {
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

const getPackage = function(pack, refresh) {
  const filename = storedir + 'packages/' + pack + '.json';
  return new Promise( (res, err) => {
    if (refresh) {
      const uri = 'https://skimdb.npmjs.com/registry/' + qs.escape(pack);
      request(uri, function(error, response, body) {
        fs.writeFileSync(filename, body);
        res(JSON.parse(body));
      });
    } else {
      res(JSON.parse(fs.readFileSync(filename, 'utf8')));
    }
  });
}

Promise.all([
  getList('hubot', refresh),
  getDep('hubot', refresh)
]).then((data) => {
  const hubot = data[0].rows.map(i => i.key[1]);
  const hubotdep = data[1].rows.map(i => i.id);
  return hubot.concat(hubotdep).sort().filter(function(el, i, a) {
    return i == a.indexOf(el);
  });
}).then((data) => {
  const processed = data.map(it => getPackage(it, refresh));
  return Promise.all(processed);
}).then((data) => {
  const timestamps = data.map(function(val) {
    const created = val.time.created;
    const modified = val.time.modified;
    const releases = Object.keys(val.time).slice(2);
    return { 
      id: val.name,
      created: created,
      modified: modified,
      releases: releases.map(i => val.time[i])
    };
  });
  return new Promise( (res, err) => {
    try {
      fs.writeFileSync(storedir + 'all_dates.json', JSON.stringify(timestamps, null, '  '));
      res('ok');
    } catch (e) {
      err('' + e);
    }
  });
}).then((data) => {
  console.log(data);
}).catch((err) => {
  console.log("Error ");
  console.log(err);
});
