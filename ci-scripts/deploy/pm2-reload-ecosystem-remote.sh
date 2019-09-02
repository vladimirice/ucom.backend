#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

PM2_EXECUTABLE=pm2

SERVER_ENV="$1";
RELOAD_FRONTEND="$2";
RELOAD_BACKEND="$3";
RELOAD_IFRAMELY="$4";

WORKING_DIR_PREFIX=/var/www/ucom
WORKING_DIR_FRONTEND_PREFIX="${WORKING_DIR_PREFIX}.frontend"
WORKING_DIR_BACKEND_PREFIX="${WORKING_DIR_PREFIX}.backend"

if [ "$SERVER_ENV" == "production" ]
then
  WORKING_DIR_SUFFIX=''
  GIT_BRANCH=master
elif [ "$SERVER_ENV" == "staging" ]
then
  WORKING_DIR_SUFFIX='.staging'
  GIT_BRANCH=staging
else
    echo ERROR: first argument must be staging or production
    exit 1
fi

WORKING_DIR_FRONTEND="${WORKING_DIR_FRONTEND_PREFIX}${WORKING_DIR_SUFFIX}"
WORKING_DIR_BACKEND="${WORKING_DIR_BACKEND_PREFIX}${WORKING_DIR_SUFFIX}"

if [ "$RELOAD_FRONTEND" == 1 ]
then
  echo "Let's reload frontend"
  cd ${WORKING_DIR_FRONTEND} || exit 1
  pwd
  git checkout ${GIT_BRANCH}
  ${PM2_EXECUTABLE} reload ecosystem-"${SERVER_ENV}".config.js --update-env
  ${PM2_EXECUTABLE} save
fi

if [ "$RELOAD_BACKEND" == 1 ]
then
  cd ${WORKING_DIR_BACKEND} || exit 1
  pwd
  git checkout ${GIT_BRANCH}
  ${PM2_EXECUTABLE} reload ecosystem-"${SERVER_ENV}".config.js --update-env
  ${PM2_EXECUTABLE} save
fi

if [ "$RELOAD_IFRAMELY" == 1 ]
then
  echo "Let's reload ifremely"

  cd ~/iframely || exit 1
  ${PM2_EXECUTABLE} reload pm2.json --update-env
  ${PM2_EXECUTABLE} save
fi
