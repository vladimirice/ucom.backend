#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

SERVER_ENV=production
WORKING_DIR=/var/www/ucom.backend
GIT_BRANCH=master

cd ${WORKING_DIR}
pwd
git checkout ${GIT_BRANCH}
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 reload ecosystem-${SERVER_ENV}.config.js --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
