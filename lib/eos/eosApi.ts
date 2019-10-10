/* eslint-disable unicorn/filename-case */
import { StringToAnyCollection } from '../common/interfaces/common-types';
import { BadRequestError } from '../api/errors';
import { IPublicKeys } from '../auth/interfaces/auth-interfaces-dto';

import EnvHelper = require('../common/helper/env-helper');

const { WalletApi, ConfigService, RegistrationApi } = require('ucom-libs-wallet');

const ecc = require('eosjs-ecc');

const { TransactionFactory, TransactionSender } = require('ucom-libs-social-transactions');

const accountsData = require('../../config/accounts-data');

const accountCreator = accountsData.account_creator;

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
  public static getCreatorAccountName(): string {
    return accountCreator.account_name;
  }

  public static getCreatorActivePrivateKey(): string {
    return accountCreator.activePk;
  }

  public static getGithubAirdropAccountName(): string {
    return accountsData[AIRDROPS_GITHUB_SENDER].account_name;
  }

  public static getGithubAirdropActivePrivateKey(): string {
    return accountsData[AIRDROPS_GITHUB_SENDER].activePk;
  }

  public static getHistoricalSenderAccountName(): string {
    return HISTORICAL_SENDER_ACCOUNT_NAME;
  }

  public static getHistoricalSenderPrivateKey(): string {
    return accountsData[HISTORICAL_SENDER_ACCOUNT_NAME].activePk;
  }

  public static getGithubAirdropHolderAccountName(): string {
    return accountsData[AIRDROPS_GITHUB_HOLDER].account_name;
  }

  public static getGithubAirdropHolderActivePrivateKey(): string {
    return accountsData[AIRDROPS_GITHUB_HOLDER].activePk;
  }

  public static initBlockchainLibraries(): void {
    WalletApi.setNodeJsEnv();
    ConfigService.initNodeJsEnv();

    EnvHelper.executeByEnvironment(initBlockchainExecutors);
  }

  public static getPublicKeysFromPermissions(
    permissions: StringToAnyCollection[], accountName: string,
  ): IPublicKeys {
    const result: IPublicKeys = {
      owner: '',
      active: '',
      social: '',
    };

    for (const name of Object.keys(result)) {
      const details = permissions.find((item) => item.perm_name === name);

      if (!details) {
        throw new BadRequestError(`${name} permission must exist, account ${accountName}`);
      }

      const { keys } = details.required_auth;

      if (keys.length === 0) {
        throw new BadRequestError(`${name} permission must have public keys, account ${accountName}`);
      }

      if (keys.length !== 1) {
        throw new BadRequestError(`${name} permission must have only one public key, account ${accountName}`);
      }

      result[name] = keys[0].key;
    }

    return result;
  }

  public static async doesAccountExist(accountName: string): Promise<boolean> {
    const state = await WalletApi.getAccountState(accountName);

    return state && Object.keys(state).length > 0;
  }

  public static async isAccountAvailable(accountName: string): Promise<boolean> {
    const exists = await this.doesAccountExist(accountName);

    return !exists;
  }

  public static async transactionToCreateNewAccount(
    newAccountName: string,
    ownerPublicKey: string,
    activePublicKey: string,
  ) {
    return RegistrationApi.createNewAccountInBlockchain(
      accountCreator.account_name,
      accountCreator.activePk,
      newAccountName,
      ownerPublicKey,
      activePublicKey,
    );
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

export = EosApi;
