"use strict";
const { BackendApi, EosClient } = require('ucom-libs-wallet');
const EosApi = require('../../../eos/eosApi');
class AirdropsTransactionsSender {
    static async sendTransaction(item) {
        // #task - github airdrop only
        const accountNameFrom = EosApi.getGithubAirdropAccountName();
        const privateKey = EosApi.getGithubAirdropActivePrivateKey();
        const permission = 'active';
        // Inside blockchain airdrop_id record has this 'composed' meaning
        const composedAirdropId = +`${item.airdrop_id}${item.symbol_id}`;
        const signedPayload = await BackendApi.getSignedAirdropTransaction(accountNameFrom, privateKey, permission, item.id, composedAirdropId, item.account_name_to, item.amount, item.symbol_title);
        const pushingResponse = await EosClient.pushTransaction(signedPayload);
        return {
            signedPayload,
            pushingResponse,
        };
    }
}
module.exports = AirdropsTransactionsSender;
