# HOW TO

Table of contents
* [How to create new table](#how-to-create-new-table)

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
