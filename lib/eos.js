// TODO Class is for playground only

const config = require('config');
const eosConfig = config.get('eosConfig');

const Eos = require('eosjs');
const eos = Eos(eosConfig);
const { ecc } = Eos.modules;

const eosAccounts  = config.get('eosAccounts');

class EosService {
  static async getCode(accountName) {
    eos.getCode(accountName).then((res) => {
      console.log(res.abi);
    });
  }

  static async getKeyAccounts(publicKey) {
    eos.getKeyAccounts(publicKey).then(val => {
      console.log(val );
    });
  }

  static async getAccount(accountName) {
    eos.getAccount(accountName).then((res) => {
      console.log(res);
    })
  }

  static async getTransaction(id) {

    eos.getTransaction({
      id
    }).then((res) => {
      console.log(res);
    });
  }

  static async getTableRows() {
    eos.getTableRows({
      json: true,
      code: 'user',
      scope: 'user',
      table: 'rate',
      limit: 9999999999,
    }).then((res) => {
      console.log(res);
    })
  }
  static async getBlock(blockNumber) {
    eos.getBlock(blockNumber).then((res) => {
      console.log(res);
    })
  }

  static async getPublicKeyByPrivate(privateKey) {
    return ecc.privateToPublic(privateKey)
  }

  static async bulidTransaction(data) {
    const keyProvider = EosService.getKeysByBrainkey(data.brainkey);
    const eos = Eos({
      keyProvider : [
        eosAccounts.creatorPrivateKey
      ],
      httpEndpoint: eosConfig.httpEndpoint,
    });

    let options = {broadcast: false};

    eos.transfer({from: 'inita', to: 'initb', quantity: '1 SYS', memo: ''}, options).then(tr => console.log(JSON.stringify(tr)));
  }

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

  static getAbi(accountName) {
    eos.getAbi(accountName).then((res) => {
      console.log('Success: ', res.abi);
    }).catch((err) => {
      console.log('error');
    })
  }


  static getActions(accountName) {
    eos.getActions(accountName).then((res) => {
      console.log(res);
    })
  }

  static sendUserToUser(senderData, recipientData) {

    const eos = Eos({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    eos.transaction({
      actions: [{
        account: 'user',
        name: 'usertouser',
        authorization: [{
          actor: senderData.account_name,
          permission: 'active',
        }],
        data: {
          acc_from: senderData.account_name,
          acc_to: recipientData.account_name,
          interaction_type_id: 1,
        },
      }],
    }).then((res) => {
      console.log(res);
    });
  }

  static sendTransaction () {
    const eos = Eos({
      keyProvider: [
        eosAccounts.creator,
        ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    return eos.transaction({
      actions: [{
        account: 'user',
        name: 'setrate',
        authorization: [{
          actor: 'eosio',
          permission: 'active',
        }],
        data: {
          // acc_from: data.account_name,
          // acc_to: 'gravitytest2',
          // interaction_type_id: 1,
          "name":"123456",
          "value":"document",
        },
      }],
    });
  };

  static getKeysByBrainkey (brainkey) {
    const ownerKey = ecc.seedPrivate(brainkey);
    const activeKey = ecc.seedPrivate(ownerKey);

    return [ownerKey, activeKey];
  };

  static privateToPublic(privateKey) {
    console.log(ecc.privateToPublic(privateKey));
  }

  static async createAccount(accountName, brainkey) {
    const ownerKey = ecc.seedPrivate(brainkey);
    const activeKey = ecc.seedPrivate(ownerKey);
    const ownerPublicKey = ecc.privateToPublic(ownerKey);
    const activePublicKey = ecc.privateToPublic(activeKey);

    const eos = Eos({
      keyProvider: [
        eosAccounts.creatorPrivateKey
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    return await eos.transaction(tr => {
      tr.newaccount({
        creator: eosAccounts.creatorAccountName,
        name: accountName,
        owner: ownerPublicKey,
        active: activePublicKey
      });

      tr.buyrambytes({
        payer: eosAccounts.creatorAccountName,
        receiver: accountName,
        bytes: 8192
      });

      tr.delegatebw({
        from: eosAccounts.creatorAccountName,
        receiver: accountName,
        stake_net_quantity: '10.0000 SYS',
        stake_cpu_quantity: '10.0000 SYS',
        transfer: 0
      })
    });
  }
}

module.exports = EosService;