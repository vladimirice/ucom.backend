# U°Community Backend API Service

## Main goals

* User authentication (via JWT tokens, stateless).
* Business logic validation before sending transactions to blockchain.
* Content storage. In future all content will be stored inside IPFS
* Blockchain information caching - for example, transactions and block producers explorer.

## Installation

Some of the servers are used via docker but not all of them. You have to install manually:
* NodeJS, NPM
* Blockchain (or use existing nodes)

Docker-compose files are for Linux only.

In future all services will be under docker.

Installation instruction (TODO):
```
   make init-project
```

## For reference

### Blockchain MongoDB indexes

#### transaction_traces

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
