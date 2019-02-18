#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

SERVER_ENV=production
WORKING_DIR=/var/www/ucom.backend
GIT_BRANCH=master

echo "!!!!!!!! Let's deploy on production !!!!!!!!"
cd ${WORKING_DIR}
pwd
git checkout ${GIT_BRANCH}
echo "Making git pull..."
git pull
echo "Let's make npm ci and install only non-dev dependencies"
npm ci --only=production
echo "Applying monolith migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=monolith
echo "Applying events migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=events
echo "Lets restart pm2 with update env and saving new configuration"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 reload ecosystem-${SERVER_ENV}.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "!!!!!!!! Deploy on production is finished !!!!!!!!"