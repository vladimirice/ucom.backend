#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

SERVER_ENV=production

echo "!!!!!!!! Let's deploy on production !!!!!!!!"
cd /var/www/ucom.backend
pwd
echo "Making git pull..."
git pull
echo "Let's make npm ci and install only non-dev dependencies"
npm ci --only=production
echo "Applying migrations..."
NODE_ENV=production node_modules/.bin/sequelize db:migrate
echo "Applying knex monolith migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=monolith
echo "Applying knex events migrations"
NODE_ENV=${SERVER_ENV} node_modules/.bin/knex migrate:latest --env=events
echo "Lets restart pm2 with update env and saving new configuration"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 reload ecosystem-production.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "!!!!!!!! Deploy on production is finished !!!!!!!!"