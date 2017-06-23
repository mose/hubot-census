#!/bin/sh

STORE_DIR="docs/data"
PACKAGES="hubot-script hubot-scripts hubot"
DEPENDS="hubot"

test -d $STORE_DIR || mkdir $STORE_DIR

for package in $PACKAGES
do
  test -f $STORE_DIR/$package.json || \
    curl -s "https://skimdb.npmjs.com/registry/_design/app/_view/byKeyword?startkey=\[\"$package\"\]&endkey=\[\"$package\",\{\}\]&group_level=3" > $STORE_DIR/$package.json
done

for depends in $DEPENDS
do
  test -f $STORE_DIR/$depends.dep.json || \
    curl -s "https://skimdb.npmjs.com/registry/_design/app/_view/dependentVersions?startkey=\[\"$depends\"\]&endkey=\[\"$depends\",\{\}\]&reduce=false" > $STORE_DIR/$depends.dep.json
done

if ! test -f $STORE_DIR/full.txt
then
  echo "refresh full"
  for package in $PACKAGES
  do
    cat $STORE_DIR/$package.json | jq '.rows[].key[1]' | sed -e 's/"//g' >> $STORE_DIR/full.txt
  done
  for depends in $DEPENDS
  do
    cat $STORE_DIR/$depends.dep.json | jq '.rows[].id' | sed -e 's/"//g' >> $STORE_DIR/full.txt
  done
fi

test -f $STORE_DIR/sorted.txt || cat $STORE_DIR/full.txt | sort | uniq > $STORE_DIR/sorted.txt

test -d $STORE_DIR/packages || mkdir $STORE_DIR/packages

echo -n "Refreshing packages info, that can take some time "

for package in `cat $STORE_DIR/sorted.txt`
do
	test -f $STORE_DIR/packages/$package || \
    (curl -s "https://skimdb.npmjs.com/registry/$package" > $STORE_DIR/packages/$package) && \
    echo -n "."
done

echo " done."
