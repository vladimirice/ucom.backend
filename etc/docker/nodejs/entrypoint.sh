#!/usr/bin/env bash

cd /var/www/ucom.backend

npm ci

node_modules/.bin/sequelize db:drop
node_modules/.bin/sequelize db:create
node_modules/.bin/sequelize db:migrate

# the --no-daemon is a minor workaround to prevent the docker container from thinking pm2 has stopped running and ending itself
pm2 start ecosystem-test.config.js --no-daemon