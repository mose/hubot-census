"use strict";

fetch("data/all_packages.json").then(function(response) {
  if(response.ok) {
    return response.json();
  }
  throw new Error('Network response was not ok.');
}).then(function(packages) {
  const today = new Date();
  const lastDay = today.setDate(today.getDate() - 1);
  const lastWeek = today.setDate(today.getDate() - 7);
  return packages.reduce(function(acc, el) {
    let lastRelease = el.releases[el.releases.length - 1];
    let lastReleaseDate = new Date(lastRelease);
    if (lastReleaseDate.getTime() > lastDay) {
      acc.today[el.id] = lastRelease;
    } else if (lastReleaseDate.getTime() > lastWeek) {
      acc.pastWeek[el.id] = lastRelease;
    }
    return acc;
  }, { today: {}, pastWeek: {} });
}).then(function(data) {
  console.log(data);
}).catch(function(error) {
  console.log('Error: ' + error.message);
});
