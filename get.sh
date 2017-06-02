#!/bin/sh

test -d tmp || mkdir tmp

test -f tmp/hubot-scripts.json || curl -s 'https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?startkey=\["hubot-scripts"\]&endkey=\["hubot-script",\{\}\]&group_level=3' > tmp/hubot-script.json
test -f tmp/hubot-scripts.json || curl -s 'https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?startkey=\["hubot-scripts"\]&endkey=\["hubot-scripts",\{\}\]&group_level=3' > tmp/hubot-scripts.json
test -f tmp/hubot.json || curl -s 'https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?startkey=\["hubot"\]&endkey=\["hubot",\{\}\]&group_level=3' > tmp/hubot.json

test -f tmp/full.txt || \
	(cat tmp/hubot-script.json | jq '.rows[].key[1]' | sed -e 's/"//g' > tmp/full.txt) && \
	(cat tmp/hubot-scripts.json | jq '.rows[].key[1]' | sed -e 's/"//g' > tmp/full.txt) && \
	(cat tmp/hubot.json | jq '.rows[].key[1]' | sed -e 's/"//g' >> tmp/full.txt)

test -f tmp/sorted.txt || cat tmp/full.txt | sort | uniq > tmp/sorted.txt

test -d tmp/packages || mkdir tmp/packages
echo -n '' > tmp/coffee
echo -n '' > tmp/no-coffee

echo -n "Refreshing packages info, that can take some time "

for package in `cat tmp/sorted.txt`
do
	test -f tmp/packages/$package || (curl -s "https://skimdb.npmjs.com/registry/$package" > tmp/packages/$package) && echo -n "."
done

echo " done."
