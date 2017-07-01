'use strict';

const request = require("request");
const qs = require('querystring');
const moment = require('moment');
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

// const makeAuthors = function(data) {

// }

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
  // const authors = data.reduce(function(acc, el) {
  //   return acc;
  // }, []);
  const timestamps = data.map(function(val) {
    const created = val.time.created;
    const modified = val.time.modified;
    const releases = Object.keys(val.time).slice(2);
    return { 
      id: val.name,
      created: created,
      modified: modified,
      latest: val.time[val["dist-tags"].latest],
      releases: releases.map(i => val.time[i])
    };
  });
  const bydates = timestamps.reduce(function(acc, el) {
    try {
      const created = moment(el.created).format('YYYYMMDD');
      if (!acc[created])
        acc[created] = { created: 0, modified: 0, releases: 0 };
      acc[created].created += 1;
    } catch (e) {
      err('' + e);
    }
    try {
      const modified = moment(el.modified).format('YYYYMMDD');
      if (!acc[modified])
        acc[modified] = { created: 0, modified: 0, releases: 0 };
      acc[modified].modified += 1;
    } catch (e) {
      err('' + e);
    }
    for (var rel in el.releases) {
      try {
        let releases = moment(el.releases[rel]).format('YYYYMMDD');
        if (!acc[releases])
          acc[releases] = { created: 0, modified: 0, releases: 0 };
        acc[releases].releases += 1;
      } catch (e) {
        err('' + e);
      }
    }
    return acc;
  }, {});
  const bymonths = timestamps.reduce(function(acc, el) {
    try {
      const created = moment(el.created).format('YYYYMM');
      if (!acc[created])
        acc[created] = { created: 0, modified: 0, releases: 0 };
      acc[created].created += 1;
    } catch (e) {
      err('' + e);
    }
    try {
      const modified = moment(el.modified).format('YYYYMM');
      if (!acc[modified])
        acc[modified] = { created: 0, modified: 0, releases: 0 };
      acc[modified].modified += 1;
    } catch (e) {
      err('' + e);
    }
    for (var rel in el.releases) {
      try {
        let releases = moment(el.releases[rel]).format('YYYYMM');
        if (!acc[releases])
          acc[releases] = { created: 0, modified: 0, releases: 0 };
        acc[releases].releases += 1;
      } catch (e) {
        err('' + e);
      }
    }
    return acc;
  }, {});
  let datetsv = 'date\tcreated\tmodified\treleased\n';
  for (var day in bydates) {
    datetsv += day + '\t' + bydates[day].created + '\t' + bydates[day].modified + '\t' + bydates[day].releases + '\n';
  }
  let monthstsv = 'date\tcreated\tmodified\treleased\n';
  for (var month in bymonths) {
    monthstsv += month + '\t' + bymonths[month].created + '\t' + bymonths[month].modified + '\t' + bymonths[month].releases + '\n';
  }
  return new Promise( (res, err) => {
    try {
      fs.writeFileSync(storedir + 'all_packages.json', JSON.stringify(timestamps, null, '  '));
      fs.writeFileSync(storedir + 'all_dates.json', JSON.stringify(bydates, null, '  '));
      fs.writeFileSync(storedir + 'all_dates.tsv', datetsv);
      fs.writeFileSync(storedir + 'all_months.tsv', monthstsv);
      res('ok');
    } catch (e) {
      err('' + e);
    }
  });
}).then((data) => {
  const stats = { updated: new Date().toJSON() };
  fs.writeFileSync(storedir + 'stats.json', JSON.stringify(stats, null, '  '));
}).catch((err) => {
  console.log("Error ");
  console.log(err);
});
