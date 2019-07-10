# Maintenance

## How to reload/restart all processes on production

It is required to reload 3 sets of services

### Backend
1. cd /var/www/ucom.backend
2. git checkout master
3. pm2 reload ecosystem-production.config.js --update-env

### Frontend 

1. cd /var/www/ucom.frontend
2. git checkout master
3. pm2 reload ecosystem-production.config.js

### Iframely

1. cd /home/dev/iframely
2. pm2 reload pm2.json 
