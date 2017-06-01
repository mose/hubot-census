Hubot census script
===================

While working on [Hubot Evolution](https://github.com/hubotio/evolution) project, it appeared meaningful to 
have some data about existing plugins for hubot.

There is already some code in https://github.com/hubotio/hubot-scripts-list for listing hubot-script packages from npmjs.org
but the type of data we need can vary.

So this very simple shell script is caching list of packages that have `hubot` or `hubot-scripts` as keyword,
and also caches the json data for those.

Then it extracts data, here we search which packages depends on coffeescript or not, but the idea is to be able to 
extract various other type of data as the need occurs.

Usage
-----

This repo comes with a cache preloaded, but information may not be up to date.

To refresh the cache, just remember it may take one hour or so to populate

		rm -rf tmp
		./get.sh

Then run your script, for example

		./dep_on_coffee.sh

Feel free to add more scripts and open PR, so we can have a collection.


Copyright
---------
Public domain - written by @mose, inspired by @technicalpickles hubot-scripts-list
