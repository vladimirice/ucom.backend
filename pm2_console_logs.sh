#!/bin/bash
. ~/.nvm/nvm.sh
. ~/.bashrc

pm2 logs $1 --lines=100