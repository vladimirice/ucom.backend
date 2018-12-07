#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

cd /var/www/ucom.backend
pwd
echo "Making git pull..."
git pull
echo "Lets make npm install"
npm install --only=prod
echo "Applying migrations..."
NODE_ENV=production node_modules/.bin/sequelize db:migrate
echo "Lets restart pm2"
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 restart ecosystem-production.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
echo "Deploy is finished"