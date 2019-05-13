# NOTEBOOK

Goal - just to save workflow before implementation.

-----------------
Script to migrate from main_image_filename to the entity_images

SELECT
       main_image_filename,
       entity_images,
       post_type_id,
       created_at,
       concat('http://backend.u.community/upload/', main_image_filename)
FROM posts
WHERE
      main_image_filename IS NOT NULL
  AND main_image_filename != ''
  AND (
    entity_images = '""'
    OR entity_images IS NULL
  )
ORDER BY main_image_filename ASC

--------------

Activity data provider 

workflow

* Fetch all blocks data one by one and save inside mock provider
* Fetch also `random blocks` - initcalc and a couple of social transaction ones

-------------

ask for last block or blocks (id > last memorized id) - 0.5

* Get last block number
SELECT block_number FROM ${TABLE_NAME} ORDER BY id DESC LIMIT 1;

* Get last_irreversible_block_number
SELECT last_state.irrblocknum FROM mongoDb.last_state

* Get new blocks:
SELECT * FROM mongoDb where blocknum > ${last_block_number} and blocknum > ${last_state.last_irreversible_block_number}

for (const block of blocks) {
check
* should be irreversible = true
* top level structure, fields existence
** blocknum
** blockid
** trxid
** account
** irreversible
** actions
*** act_data inside
** blocktime

* Check every action basic structure
** act_data - array

** push it to chain of responsibility
}

transfer and link to next checker inside

transfer checks data -
if it is ok then generate backend-parsed data and return it
=> special Dto to save to tr_traces
else - move to next

if nothing - special processor parse it as `undetermined` (special key) and put into db

Next step:
* Just receive data from chain processor and save it to db

chain of responsibility - check conditions for every transaction processing block - 1h
** If match then process it - call related processor => Save processed data to postgres (same structure but new table) - 0.5h
Autotests, patterns implementations - 1.5h

insert {
    tr_type - determined by backend
    tr_processed_data - raw data parsed by backend
    memo - from action_traces
    tr_id - raw data - first level
    external_id - ? not required any more. Deprecated one
    account_name_from - raw data
    account_name_to - raw data
    raw_tr_data - save raw tr trace from mongodb. Will be removed in the future
}

add new columns
block_number -> blocknum
block_id -> blockid
tr_id -> trxid


add column block id to new table

===================

Before staging deployment:
* Create connection inside staging config

Before production deployment:
* Create connection inside staging config

Before activity table renaming:
* add filter for activity - WHERE tr_type != `${UNDETERMINED_TYPE}`
* check manually all transactions - it is not required to provide integration autotests

Extra:
* Registration
* Vote for calculators
* Unstake resources as result (delayed action)


### GraphQL as a constructor:
* There is a query:

query {

}

* inside it you can pass any `nodes`
* there is a myselfData for blockchain nodes. Do not pass it inside blockchain nodes
* create separate `node` - many_blockchain_nodes with the different filter
* you can combine `nodes` as you want to create different web pages
* inside a server you can parse overall query and decide to merge requests into one if appreciable (via JOIN)
etc without any changes of a interface


About aliases:
* https://medium.com/graphql-mastery/graphql-quick-tip-aliases-567303a9ddc5

======

Airdrops resetting workflow:
* disable all airdrops workers
production_worker_airdrops_users_to_pending
production_worker_airdrops_users_to_waiting
production_worker_airdrops_users_to_received

Clear tables data:
ALTER SEQUENCE airdrops_id_seq RESTART;



TRUNCATE TABLE airdrops_users_external_data;
TRUNCATE TABLE airdrops_users;
TRUNCATE TABLE accounts_transactions_parts;

DELETE FROM airdrops_tokens WHERE 1=1;

DELETE FROM accounts_transactions WHERE 1=1;

DELETE FROM accounts WHERE 1=1;

DELETE FROM airdrops WHERE 1=1;

DELETE FROM users_external_auth_log WHERE 1=1;
DELETE FROM users_external WHERE 1=1;

DELETE FROM blockchain.outgoing_transactions_log WHERE 1=1;

Reset airdrops sequence in order to create airdrop with an ID = 1

