#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

cd /var/www/uos.app.backend.staging
pwd
echo "Making git pull..."
git pull
echo "Git pull is ended"
echo "Applying migrations..."
NODE_ENV=staging node_modules/.bin/sequelize db:migrate
echo "Applying migrations done"
echo "Lets make npm install"
npm install --only=prod
npm i uos-app-transaction
npm i uos-app-wallet
echo "NPM install is done"
echo "Lets restart pm2"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 restart ecosystem-staging.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "Restart is finished"
echo "Deploy is finished"