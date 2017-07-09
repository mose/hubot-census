Hubot census script
===================

While working on [Hubot Evolution](https://github.com/hubotio/evolution) project, it appeared meaningful to 
have some data about existing plugins for hubot.

There is already some code in https://github.com/hubotio/hubot-scripts-list for listing hubot-script packages from npmjs.org
but the type of data we need can vary.

So this very simple shell script is caching list of packages that have `hubot` or `hubot-scripts` as keyword,
and also caches the json data for those.

The scan is cronned to run every 6 hours and result is shown on https://mose.github.io/hubot-census/

Usage
-----

This repo comes with a cache preloaded, but information may not be up to date.

To refresh the cache, it takes 3 minutes or so to populate

		node bin/get.js refresh



Copyright
---------
Public domain - written by @mose, inspired by @technicalpickles hubot-scripts-list
