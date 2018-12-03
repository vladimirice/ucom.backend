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

## For reference

Create models with help of sequelize
```
    node_modules/.bin/sequelize model:generate --name Users --attributes email:string,password:string
```

Start pm2 with ecosystem
```
    pm2 start ecosystem.config.js --env production --only uos_backend
    pm2 restart ecosystem.config.js --env production --only uos_backend
```

## Further steps

Create user tables with relations
Provide an api to get users
- to set users

step 2 - add relations
step 3 - add joi for validation
step 4 - provide auth


Auth
* passport

## MongoDb indexes

### transaction_traces

```
account_and_name_and_from_and_to_ids
{
  "action_traces.act.account" : 1,
  "action_traces.act.name" : 1,
  "action_traces.act.data.from" : 1,
  "action_traces.act.data.to" : 1
}

account_and_name_idx
{
  "action_traces.act.account" : 1,
  "action_traces.act.name" : 1
}
```