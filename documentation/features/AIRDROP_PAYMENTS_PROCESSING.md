# Airdrop payments processing

![Airdrop payment transactions](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/airdrop-payment-transactions.jpg)

![Debt-credit pattern table structure](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/debt-credit-pattern-table-structure.png)

There are different accounts in the system to represent the balance flows:

Account type | Description
--- | ---
`income` | To track incoming balances, always negative. A new emission of tokens to distribute
`debt` | To track the current system account balance, a positive amount. Amount of of tokens not yet distributed  
`reserved` | Amount of tokens user should receive in the future.
`waiting` | Amount of tokens represented by blockchain transaction which is already sent to the blockchain
`wallet` | Current amount of airdrop tokens under the user's control 

Note: for every new `symbol`, a group of accounts should be created.

## Workflow (with example numbers):

Note: beforehand, `debt` and `income` accounts must be created.

* There is a new token distribution for airdrop, amount = 100 000 tokens (`TNS`). 
* New transaction - from `income` (- 100 000) to `debt` (100 000).
* User is asking about his airdrop state.
* User fulfills some business conditions to participate (ex. follows DevExchange community)
* Background worker checks conditions and determines users that fulfill all conditions.
* `reserved,` `waiting` and `wallet` accounts are created.
* Transaction is created: from `debt` to `reserved`, amount = 100 TNS
* Other worker fetches `pending` users and creates blockchain transaction.
* The transaction is created and is sent to the blockchain. The transaction ID is received.
* DB transaction is created: from `reserved` to `waiting.`
* Background worker checks transaction's state
    * If success - from `waiting` to `wallet.`
    * If fail - rollback from `waiting` to `reserved.`

## Database structure

Please observe the migrations. 
The first one is [create-tables-airdrops-and-accounts](../../migrations_knex_monolith/20190320083713_create-tables-airdrops-and-accounts.js)
