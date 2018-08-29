const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);
const { ecc } = EosPlayground.modules;

const AccountsData = require('../../config/accounts-data');

const accountCreator = AccountsData.account_creator;

class EosAuth {
  static async isAccountAvailable(accountName) {
    try {
      const account = await eos.getAccount(accountName);
      if (account) {
        return false;
      }
    } catch (error) {
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

  static async createAccount(accountName, ownerPublicKey, activePublicKey) {
    const eos = EosPlayground({
      keyProvider: [
        accountCreator['activePk']
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    return await eos.transaction(tr => {
      tr.newaccount({
        creator: accountCreator['account_name'],
        name: accountName,
        owner: ownerPublicKey,
        active: activePublicKey
      });

      tr.buyrambytes({
        payer: accountCreator['account_name'],
        receiver: accountName,
        bytes: 8192
      });

      tr.delegatebw({
        from: accountCreator['account_name'],
        receiver: accountName,
        stake_net_quantity: '10.0000 SYS',
        stake_cpu_quantity: '10.0000 SYS',
        transfer: 0
      })
    });
  }

  static async getAccountInfo(account_name) {
    const account = await eos.getAccount(account_name);

    console.log(account);
  }
}


module.exports = EosAuth;