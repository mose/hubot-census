#!/bin/sh

git pull
node bin/get.js refresh
git add docs/data
git status -s
git commit -m'daily update' docs/data
git push
