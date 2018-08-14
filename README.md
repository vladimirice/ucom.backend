# U.community backend API service

## Installation

```
    npm install
```

In order to install database (PostgreSQL):

[Install docker desktop](https://www.docker.com/products/docker-desktop). Edge version is preferable

### Commands for Mac

```
    ln -s etc/docker/docker-compose-mac.yml docker-compose.yml
    make d-up-f
    make docker-set-hosts-mac
```

### Commands for Linux
TODO

## Shortcuts

node_modules/.bin/sequelize model:generate --name Users --attributes email:string,password:string
