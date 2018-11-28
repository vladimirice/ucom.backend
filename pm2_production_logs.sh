#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

tail -f /var/www/uos.app.backend/logs/app_error.log --lines=100
#less /var/www/uos.app.backend/logs/app1.log