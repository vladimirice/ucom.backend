#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

cd ~/iframely
pm2 reload pm2.json --update-env
/home/dev/.nvm/versions/node/v10.9.0/bin/pm2 save
