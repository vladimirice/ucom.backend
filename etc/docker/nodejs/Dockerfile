FROM node:10

RUN npm install -g pm2

RUN groupadd -r docker \
    && usermod -a -G docker node

ENTRYPOINT ["tail", "-f", "/dev/null"]

