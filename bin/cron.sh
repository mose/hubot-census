#!/bin/sh

node bin/get.js refresh
git add docs/data
git commit -m'daily update' docs/data
git push
