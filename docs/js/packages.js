"use strict";

const githubicon = '<svg viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>';

const showRecent = function(selector, data) {
  const div = document.querySelector(selector);
  for (var el in data) {
    console.log(data[el]);
    const divlist = document.createElement('div');
    divlist.className = "package";
    div.appendChild(divlist);
    divlist.insertAdjacentHTML("beforeend", "<h3>" + data[el].name + ' <span>' + data[el]["dist-tags"].latest + '</span></h3>\n');
    if (data[el].homepage) {
      divlist.insertAdjacentHTML("beforeend", '<a href="' + data[el].homepage + '" class="icon" target="_new">' + githubicon + '</a>\n');
    }
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
