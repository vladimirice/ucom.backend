#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

echo "Let's deploy on staging"
cd /var/www/ucom.backend.staging
pwd
git fetch
git checkout staging
echo "Making git pull..."
git pull
echo "Let's make npm install"
npm install --only=prod
echo "Applying migrations..."
NODE_ENV=staging node_modules/.bin/sequelize db:migrate
echo "Lets restart pm2 with update env and saving new configuration"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 restart ecosystem-staging.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "Deploy on staging is finished"