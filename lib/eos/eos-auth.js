const config    = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);
const { ecc } = EosPlayground.modules;

const AccountsData = require('../../config/accounts-data');

const accountCreator = AccountsData.account_creator;

const UOS_SYSTEM_ACCOUNT          = 'eosio';

const ACTION__NEW_ACCOUNT         = 'newaccount';
const ACTION__BUY_RAM_BYTES       = 'buyrambytes';
const ACTION__DELEGATE_BANDWIDTH  = 'delegatebw';

const MEMORY_BYTES_FOR_NEW_ACCOUNT  = 8192;
const STAKE_NET_QUANTITY            = '1.0000 UOS';
const STAKE_CPU_QUANTITY            = '1.0000 UOS';

class EosAuth {
  // noinspection FunctionWithInconsistentReturnsJS
  static async isAccountAvailable(accountName) {
    try {
      // noinspection JSUnresolvedFunction
      const account = await eos.getAccount(accountName);
      if (account) {
        return false;
      }
    } catch (error) {
      // noinspection UnusedCatchParameterJS
      try {
        const data = JSON.parse(error.message);
        return data.error.what === 'unspecified';
      } catch(e) {
        return false;
      }
    }
  }

  static async doesAccountExist(accountName) {
    const result = await EosAuth.isAccountAvailable(accountName);

    return !result;
  }

  static getKeysByBrainkey (brainkey) {
    const ownerKey = ecc.seedPrivate(brainkey);
    const activeKey = ecc.seedPrivate(ownerKey);

    return [ownerKey, activeKey];
  };

  static getActivePrivateKeyByBrainkey(brainkey) {
    const keys = EosAuth.getKeysByBrainkey(brainkey);

    return keys[1];
  }

  static getOwnerPublicKeyByBrainKey(brainkey) {
    const keys = EosAuth.getKeysByBrainkey(brainkey);

    const ownerPrivateKey = keys[0];

    return EosAuth.getPublicKeyByPrivate(ownerPrivateKey);
  }

  static getPublicKeyByPrivate(privateKey) {
    return ecc.privateToPublic(privateKey)
  }

  /**
   *
   * @param {string} new_account_name
   * @param {string} ownerPubKey
   * @param {string} activePubKey
   * @return {Promise<*>}
   */
  static async transactionToCreateNewAccount(new_account_name, ownerPubKey, activePubKey) {
    const eos = EosPlayground({
      keyProvider:  [ accountCreator.activePk ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose:      true,
    });

    const authorization = [{
      actor:      accountCreator.account_name,
      permission: 'active',
    }];

    // noinspection JSUnresolvedFunction
    return await eos.transaction({
      actions: [{
        account:  UOS_SYSTEM_ACCOUNT,
        name:     ACTION__NEW_ACCOUNT,
        authorization,
        data: {
          creator: accountCreator.account_name,
          name:    new_account_name,
          owner: {
            threshold: 1,
            keys: [{
              key: ownerPubKey,
              weight: 1
            }],
            accounts: [],
            waits: []
          },
          active: {
            threshold: 1,
            keys: [{
              key: activePubKey,
              weight: 1
            }],
            accounts: [],
            waits: []
          },
        },
      },
      {
        account: UOS_SYSTEM_ACCOUNT,
        name: ACTION__BUY_RAM_BYTES,
        authorization,
        data: {
          payer:    accountCreator.account_name,
          receiver: new_account_name,
          bytes:    MEMORY_BYTES_FOR_NEW_ACCOUNT,
        },
      },
      {
        account:  UOS_SYSTEM_ACCOUNT,
        name:     ACTION__DELEGATE_BANDWIDTH,
        authorization,
        data: {
          from: accountCreator.account_name,
          receiver: new_account_name,
          stake_net_quantity: STAKE_NET_QUANTITY,
          stake_cpu_quantity: STAKE_CPU_QUANTITY,
          transfer: 0,
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });
  }

  static async getAccountInfo(account_name) {
    // noinspection JSUnresolvedFunction
    const account = await eos.getAccount(account_name);

    console.log(account);
  }
}


module.exports = EosAuth;