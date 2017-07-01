"use strict";

const showRecent = function(selector, data) {
  const div = document.querySelector(selector);
  for (var el in data) {
    // console.log(data[el]);
    const divlist = document.createElement('div');
    divlist.className = "package";
    div.appendChild(divlist);
    divlist.insertAdjacentHTML("beforeend", "<h3>" + data[el].name + ' <span>' + data[el]["dist-tags"].latest + '</span></h3>\n');
    divlist.insertAdjacentHTML("beforeend", "<div class=\"description\">" + data[el].description + '</div>\n');
    const releasedate = new Date(data[el].time[data[el]["dist-tags"].latest]);
    divlist.insertAdjacentHTML("beforeend", "<div class=\"date\">" + releasedate.toLocaleDateString() + '</div>\n');
  }
}

const getPackage = function(pack) {
  return fetch('data/packages/' + pack + '.json').then(function(response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Network response was not ok.');
  });
}

let payload = {};
fetch("data/all_packages.json").then(function(response) {
  if (response.ok) {
    return response.json();
  }
  throw new Error('Network response was not ok.');
}).then(function(packages) {
  const today = new Date();
  const lastDay = today.setDate(today.getDate() - 1);
  const lastWeek = today.setDate(today.getDate() - 7);
  payload = packages.reduce(function(acc, el) {
    let lastRelease = el.latest;
    let lastReleaseDate = new Date(lastRelease);
    if (lastReleaseDate.getTime() > lastDay) {
      acc.today.push({ id: el.id, date: lastRelease});
    } else if (lastReleaseDate.getTime() > lastWeek) {
      acc.pastWeek.push({ id: el.id, date: lastRelease});
    }
    return acc;
  }, { today: [], pastWeek: [] });
  payload.today = payload.today.sort(function(a, b) {
    return - a.date.localeCompare(b.date);
  });
  payload.pastWeek = payload.pastWeek.sort(function(a, b) {
    return - a.date.localeCompare(b.date);
  });
  return 'ok';
}).then(function(data) {
  payload.today = payload.today.map(e => getPackage(e.id));
  payload.pastWeek = payload.pastWeek.map(e => getPackage(e.id));
  return Promise.all(payload.today);
}).then(function(data) {
  showRecent("div.recent", data);
  return Promise.all(payload.pastWeek);
}).then(function(data) {
  showRecent("div.pastweek", data);
}).catch(function(error) {
  console.log('Error: ' + error.message);
});
