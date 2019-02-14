#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

SERVER_ENV=staging
GIT_BRANCH=staging
WORKING_DIR=/var/www/ucom.backend.staging

echo "Let's deploy on ${SERVER_ENV}"
cd ${WORKING_DIR}
pwd
git checkout ${GIT_BRANCH}
echo "Making git pull"
git pull
echo "Let's make npm ci and install only production dependencies"
npm ci --only=production
echo "Applying sequelize monolith migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/sequelize db:migrate
echo "Applying knex monolith migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=monolith
echo "Applying knex events migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=events
echo "Lets reload pm2 with update env and saving new configuration"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 reload ecosystem-${SERVER_ENV}.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "Deploy on ${SERVER_ENV} is finished"