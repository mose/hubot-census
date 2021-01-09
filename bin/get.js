'use strict';

const request = require("request");
const moment = require('moment');
const fs = require("fs");

const storedir = 'docs/data/';
// const storedir = 'tmp/';
const refresh = (process.argv[2] === 'refresh');

const getList = (name, refresh) => {
    const filename = storedir + name + '.list.json';
    const searchPackages = (callback, offset = 0) => {
        const url = `https://registry.npmjs.org/-/v1/search?text=hubot&from=${offset}&size=200`
        request(url, (error, res, body) => {
            let full = JSON.parse(body)
            callback(full)
        })
    }

    return new Promise((callback, err) => {
        fs.stat(filename, function (err, stat) {
            if (refresh || err !== null) {
                searchPackages((full) => {
                    let results = full.objects
                    let calls = []
                    for (let offset = 0; offset <= full.total; offset += 200) {
                        calls.push(new Promise((call, err) => searchPackages(call, offset)))
                    }
                    console.log(calls)
                    Promise.allSettled(calls)
                        .then((data, err) => {
                            let filteredData = data.flatMap(
                                (value) => value.value.objects
                            ).filter(
                                (dep) => {
                                    let keywords = dep.package.keywords || []
                                    return dep.package.name.indexOf('hubot') >= 0
                                        || keywords.includes('hubot')
                                        || keywords.includes('hubot-scripts')
                                }
                            )
                            fs.writeFileSync(filename, JSON.stringify(filteredData));
                            callback(filteredData)
                        })
                })
            } else {
                console.log(filename)
                res(JSON.parse(fs.readFileSync(filename, 'utf8')));
            }
        })
    })
}

const getPackage = function (pack, refresh) {
    const filename = storedir + 'packages/' + key.replace("/", "_") + '.json';

    return new Promise((res, err) => {
        fs.stat(filename, function (err, stat) {
            if (refresh || err !== null) {
                console.log(key)
                const uri = `https://registry.npmjs.org//${key}`
                request(uri, function (error, response, body) {
                    if (error) throw error
                    fs.writeFileSync(filename, body);
                    res(JSON.parse(body));
                });
            } else {
                console.log(key)
                res(JSON.parse(fs.readFileSync(filename, 'utf8')));
            }
        });
    });
}

const makeAuthors = function(data) {
  let names = []
  if (data.author instanceof Object) {
    if (data.author.name) {
      names.push(data.author.name);
    } else if (data.author.email) {
      names.push(data.author.email);
    }
  } else {
    names.push(data.author);
  }
  if (data.maintainers) {
    for (var i in data.maintainers) {
      if (data.maintainers[i] instanceof Object) {
        if (data.maintainers[i].name) {
          names.push(data.maintainers[i].name);
        } else if (data.maintainers[i].email) {
          names.push(data.maintainers[i].email);
        }
      } else {
        names.push(data.maintainers[i]);
      }
    }
  }
  return names;
}

Promise.all([
    getList('hubot', refresh)
]).then((data) => {
    const hubot = data[0].map(i => i.package.name);
    return hubot.sort().filter(function (el, i, a) {
        return i == a.indexOf(el);
    });
}).then((data) => {
  const processed = data.map(it => getPackage(it, refresh));
  return Promise.all(processed);
}).then((data) => {
  const authorslist = data.reduce(function(acc, el) {
    acc = acc.concat(makeAuthors(el));
    return acc;
  }, []);
  const authors = authorslist.filter((v, i, a) => a.indexOf(v) === i);;
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
  let bymonths = timestamps.reduce(function(acc, el) {
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
  // need to adjust currnet month to be proprotional
  const thismonth = moment().format("YYYYMM");
  const thisday = moment().format("D");
  const factor = moment().daysInMonth() / moment().format("D");
  bymonths[thismonth] = {
    created: Math.round(bymonths[thismonth].created * factor),
    modified: Math.round(bymonths[thismonth].modified * factor),
    releases: Math.round(bymonths[thismonth].releases * factor),
  }
  let datetsv = 'date\tcreated\tmodified\treleased\n';
  for (var day in bydates) {
    datetsv += day + '\t' + bydates[day].created + '\t' + bydates[day].modified + '\t' + bydates[day].releases + '\n';
  }
  let monthstsv = 'date\tcreated\tmodified\treleased\n';
  for (var month in bymonths) {
    monthstsv += month + '\t' + bymonths[month].created + '\t' + bymonths[month].modified + '\t' + bymonths[month].releases + '\n';
  }
  return new Promise( (res, err) => {
    const stats = { 
      updated: new Date().toJSON(),
      contributors: authors.length
    };
    try {
      fs.writeFileSync(storedir + 'all_packages.json', JSON.stringify(timestamps, null, '  '));
      fs.writeFileSync(storedir + 'all_dates.json', JSON.stringify(bydates, null, '  '));
      fs.writeFileSync(storedir + 'all_dates.tsv', datetsv);
      fs.writeFileSync(storedir + 'all_months.tsv', monthstsv);
      fs.writeFileSync(storedir + 'stats.json', JSON.stringify(stats, null, '  '));
      res('ok');
    } catch (e) {
      err('' + e);
    }
  });
}).catch((err) => {
  console.log("Error ");
  console.log(err);
});
