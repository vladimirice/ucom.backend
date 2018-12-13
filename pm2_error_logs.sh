#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

STAGING_ERROR_LOG_FILENAME=/var/www/ucom.backend.staging/logs/app_error.log
PRODUCTION_ERROR_LOG_FILENAME=/var/www/ucom.backend/logs/app_error.log
LOG_FILENAME=''

case "$1" in
    staging )
        LOG_FILENAME=${STAGING_ERROR_LOG_FILENAME}
     ;;
    production )
        LOG_FILENAME=${PRODUCTION_ERROR_LOG_FILENAME}
     ;;
esac

echo ${LOG_FILENAME}

tail -f ${LOG_FILENAME} --lines=100