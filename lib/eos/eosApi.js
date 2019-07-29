"use strict";
/* eslint-disable unicorn/filename-case */
const EnvHelper = require("../common/helper/env-helper");
const { WalletApi, ConfigService } = require('ucom-libs-wallet');
const ecc = require('eosjs-ecc');
const { TransactionFactory, TransactionSender } = require('ucom-libs-social-transactions');
const brainkey = require('../crypto/brainkey');
const accountsData = require('../../config/accounts-data');
const accountCreator = accountsData.account_creator;
const BRAINKEY_LENGTH = 12;
const ACCOUNT_NAME_LENGTH = 12;
const AIRDROPS_GITHUB_SENDER = 'airdrops_github_sender';
const AIRDROPS_GITHUB_HOLDER = 'airdrops_github_holder';
const HISTORICAL_SENDER_ACCOUNT_NAME = 'uoshistorian';
const initBlockchainExecutors = {
    [EnvHelper.testEnv()]: () => {
        WalletApi.initForTestEnv();
        ConfigService.initForTestEnv();
        TransactionFactory.initForTestEnv();
        TransactionSender.initForTestEnv();
    },
    [EnvHelper.stagingEnv()]: () => {
        WalletApi.initForStagingEnv();
        ConfigService.initForStagingEnv();
        TransactionFactory.initForStagingEnv();
        TransactionSender.initForStagingEnv();
    },
    [EnvHelper.productionEnv()]: () => {
        WalletApi.initForProductionEnv();
        ConfigService.initForProductionEnv();
        TransactionFactory.initForProductionEnv();
        TransactionSender.initForProductionEnv();
    },
};
class EosApi {
    static getGithubAirdropAccountName() {
        return accountsData[AIRDROPS_GITHUB_SENDER].account_name;
    }
    static getGithubAirdropActivePrivateKey() {
        return accountsData[AIRDROPS_GITHUB_SENDER].activePk;
    }
    static getHistoricalSenderAccountName() {
        return HISTORICAL_SENDER_ACCOUNT_NAME;
    }
    static getHistoricalSenderPrivateKey() {
        return accountsData[HISTORICAL_SENDER_ACCOUNT_NAME].activePk;
    }
    static getGithubAirdropHolderAccountName() {
        return accountsData[AIRDROPS_GITHUB_HOLDER].account_name;
    }
    static getGithubAirdropHolderActivePrivateKey() {
        return accountsData[AIRDROPS_GITHUB_HOLDER].activePk;
    }
    static initBlockchainLibraries() {
        WalletApi.setNodeJsEnv();
        ConfigService.initNodeJsEnv();
        EnvHelper.executeByEnvironment(initBlockchainExecutors);
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
    static async isAccountAvailable(accountName) {
        return TransactionSender.isAccountAvailable(accountName);
    }
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
