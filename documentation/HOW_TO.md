# HOW TO


## How are blockchain nodes `amounts` calculated

* Fetch all blockchain nodes with the votes.
* Fetch voters scaled_importance and stake.
* Total node `scaled_importance_amount` is a sum of current `scaled_importance` values of voters.
* Total node `stake_amount` is a sum of current `stake` values of voters.

## How to reload all services

* Reload backend infrastructure services. See [uos_backend_deploy_production](../uos_backend_deploy_production.sh)
* Reload iframely service
```
make pm2-reload-iframely
```
* Reload frontend application (server site rendering)

## How to create new table
* Run the following command:
```
NAME='migration-file-name' make docker-db-create-migration-monolith
```

* Write migration code
* Run the following command:
```
    make docker-migrate-monolith-via-knex
```
* Add table to [SeedsHelper](../test/integration/helpers/seeds-helper.ts) `minorTables` or `majorTables` array 
* Same workflow for the `events` - refer to [Makefile](../Makefile)

## How to add new transaction method

Please add it to the ucom.libs.wallet library.

## Helpers
* [BatchProcessingHelper](../lib/common/helper/batch-processing-helper.ts)
