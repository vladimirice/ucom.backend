#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

tail -f /var/www/ucom.backend/logs/app_error.log --lines=100