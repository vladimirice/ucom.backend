FROM node:10

# Install PM2
RUN npm install -g pm2

COPY ./etc/docker/nodejs/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

