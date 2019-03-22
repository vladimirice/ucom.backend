"use strict";
const AirdropsUsersExternalDataRepository = require("../../repository/airdrops-users-external-data-repository");
class AirdropsUsersToPendingService {
    static async process(airdropId) {
        // @ts-ignore
        const freshUsers = await AirdropsUsersExternalDataRepository.getManyUsersWithStatusNew(airdropId);
        // @ts-ignore
        const a = 0;
        /*
    IF there are users to process THEN
    * Check airdrop conditions and fetch users that are OK for airdrop
    * IF _.isEmpty(users_to_process) === false THEN
    
    -- SELECT required debt account data
    
    SELECT
        debt.id AS debt_account_id,
        debt.symbol_id AS symbol_id,
        debt.current_balance AS current_balance
    FROM
        airdrops_tokens
    INNER JOIN accounts debt ON debt.id = airdrops_tokens.debt_account_id
    WHERE airdrops_tokens.airdrop_id = ${airdropId}
    
    
    * Check tokens consistency
    * START TRANSACTION
    
    * Create accounts
    ** reserved
    ** waiting
    ** wallet
    
    * Create two transactions - for every token in set + update all balances
    * change status in table airdrops_users_external_data to ${Statuses.PENDING}
    * COMMIT
         */
    }
}
module.exports = AirdropsUsersToPendingService;
