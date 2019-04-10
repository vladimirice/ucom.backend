"use strict";
const errors_1 = require("../api/errors");
const EnvHelper = require("../common/helper/env-helper");
const { WalletApi } = require('ucom-libs-wallet');
const ecc = require('eosjs-ecc');
const { TransactionFactory, TransactionSender } = require('ucom-libs-social-transactions');
const brainkey = require('../crypto/brainkey');
const accountsData = require('../../config/accounts-data');
const accountCreator = accountsData.account_creator;
const BRAINKEY_LENGTH = 12;
const ACCOUNT_NAME_LENGTH = 12;
const AIRDROPS_GITHUB_SENDER = 'airdrops_github_sender';
class EosApi {
    static getGithubAirdropAccountName() {
        return accountsData[AIRDROPS_GITHUB_SENDER].account_name;
    }
    static getGithubAirdropActivePrivateKey() {
        return accountsData[AIRDROPS_GITHUB_SENDER].activePk;
    }
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
    static initWalletApi() {
        WalletApi.setNodeJsEnv();
        if (EnvHelper.isProductionEnv()) {
            WalletApi.initForProductionEnv();
        }
        else if (EnvHelper.isStagingEnv()) {
            WalletApi.initForStagingEnv();
        }
        else if (EnvHelper.isTestEnv()) {
            WalletApi.initForTestEnv();
        }
        else {
            throw new errors_1.AppError(`Unsupported env: ${EnvHelper.getNodeEnv()}`);
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
    // noinspection JSUnusedGlobalSymbols
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
    static getKeysByBrainkey(value) {
        const ownerKey = ecc.seedPrivate(value);
        const activeKey = ecc.seedPrivate(ownerKey);
        return [ownerKey, activeKey];
    }
    static getActivePrivateKeyByBrainkey(value) {
        const keys = this.getKeysByBrainkey(value);
        return keys[1];
    }
    static getOwnerPublicKeyByBrainKey(value) {
        const keys = this.getKeysByBrainkey(value);
        const ownerPrivateKey = keys[0];
        return this.getPublicKeyByPrivate(ownerPrivateKey);
    }
    static getPublicKeyByPrivate(privateKey) {
        return ecc.privateToPublic(privateKey);
    }
}
module.exports = EosApi;
