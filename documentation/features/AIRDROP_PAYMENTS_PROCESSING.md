# Airdrop payments processing

There are different accounts in the system to represent the balance flows:

type | description
--- | ---
`debt` | To track incoming balances, a positive amount
`income` | To track incoming balances, always negative. Required to track new amounts of tokens for an airdrop (`debt` + `income` = 0) 
`reserved` | amount of tokens user should receive in the future if everything goes ok
`waiting` | amount of tokens represented by blockchain transaction which is already sent to the blockchain
`wallet` | Current amount of airdrop tokens under the user's control 


Notes:
* For every new `symbol` new balance account record should be created


### Workflow (with example numbers):

Beforehand - `debt` and `income` accounts must be created.

* There is a new token distribution for airdrop, amount = 100 000 tokens (`TNS`). 
* New transaction - from `income` (- 100 000) to `debt` (100 000).
* User is asking about his airdrop state.
* User fulfills some business conditions to participate (ex. follows DevExchange community)
* Background worker checks conditions and determines users that fulfill all conditions.
* `reserved,` `waiting` and `wallet` accounts are created.
* Transaction is created: from `debt` to `reserved`, amount = 100 TNS
* Other worker fetches `pending` users and creates blockchain transaction.
* The transaction is created and is sent to the blockchain. The transaction ID is received.
check airdrop state in the background
* DB transaction is created: from `reserved` to `waiting.`
* Background worker checks user's airdrop conditions.
** If success - from `waiting` to `wallet.`
** If fail - rollback from `waiting` to `reserved.`


### Database structure

Please observe the migrations. 
The first one is [create-tables-airdrops-and-accounts](../../migrations_knex_monolith/20190320083713_create-tables-airdrops-and-accounts.js)
