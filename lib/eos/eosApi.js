"use strict";
const ecc = require('eosjs-ecc');
const brainkey = require('../crypto/brainkey');
const { TransactionFactory, TransactionSender } = require('ucom-libs-social-transactions');
const accountsData = require('../../config/accounts-data');
const accountCreator = accountsData.account_creator;
const BRAINKEY_LENGTH = 12;
const ACCOUNT_NAME_LENGTH = 12;
class EosApi {
    static initTransactionFactory() {
        if (process.env.NODE_ENV === 'production') {
            TransactionFactory.initForProductionEnv();
            TransactionSender.initForProductionEnv();
        }
        else if (process.env.NODE_ENV === 'staging') {
            TransactionFactory.initForStagingEnv();
            TransactionSender.initForStagingEnv();
        }
        else {
            TransactionFactory.initForTestEnv();
            TransactionSender.initForTestEnv();
        }
    }
    /**
     *
     * @return {string}
     */
    static createRandomAccountName() {
        let text = '';
        const possible = 'abcdefghijklmnopqrstuvwxyz12345';
        for (let i = 0; i < ACCOUNT_NAME_LENGTH; i += 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    static async doesAccountExist(accountName) {
        const result = await TransactionSender.isAccountAvailable(accountName);
        return !result;
    }
    // static getAbi(accountName) {
    //   // noinspection JSUnresolvedFunction
    //   eos.getAbi(accountName).then((res) => {
    //
    //     console.dir(res);
    //
    //     // const structs = res.abi.structs;
    //     //
    //     // const utc = structs.find(data => data.name === 'usertocont');
    //     //
    //     // console.log(utc);
    //     //
    //
    //     console.log('Success: ', JSON.stringify(res.abi.structs, null, 2));
    //   }).catch((err) => {
    //     console.log('Error of get abi: ', err);
    //   })
    // }
    // static async getAccountInfo(accountName) {
    //   // noinspection JSUnresolvedFunction
    //   return await eos.getAccount(accountName);
    // }
    // noinspection JSUnusedGlobalSymbols
    static generateBrainkey() {
        return brainkey.generateSimple(BRAINKEY_LENGTH);
    }
    /**
     *
     * @param {string} newAccountName
     * @param {string} ownerPubKey
     * @param {string} activePubKey
     * @return {Promise<*>}
     */
    static async transactionToCreateNewAccount(newAccountName, ownerPubKey, activePubKey) {
        return TransactionSender.createNewAccountInBlockchain(accountCreator.account_name, accountCreator.activePk, newAccountName, ownerPubKey, activePubKey);
    }
    static getKeysByBrainkey(brainkey) {
        const ownerKey = ecc.seedPrivate(brainkey);
        const activeKey = ecc.seedPrivate(ownerKey);
        return [ownerKey, activeKey];
    }
    static getActivePrivateKeyByBrainkey(brainkey) {
        const keys = this.getKeysByBrainkey(brainkey);
        return keys[1];
    }
    static getOwnerPublicKeyByBrainKey(brainkey) {
        const keys = this.getKeysByBrainkey(brainkey);
        const ownerPrivateKey = keys[0];
        return this.getPublicKeyByPrivate(ownerPrivateKey);
    }
    static getPublicKeyByPrivate(privateKey) {
        return ecc.privateToPublic(privateKey);
    }
}
module.exports = EosApi;
