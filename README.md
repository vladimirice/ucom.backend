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

Create user tables with relations
Provide an api to get users
- to set users

step 2 - add relations
step 3 - add joi for validation
step 4 - provide auth
