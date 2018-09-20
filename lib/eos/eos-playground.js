// TODO Class is for playground only

const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);
const { ecc } = EosPlayground.modules;

const eosAccounts  = config.get('eosAccounts');

const ACTIVITY_CONTRACT = 'uos.activity';

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

  static getPublicKeyByPrivate(privateKey) {
    return ecc.privateToPublic(privateKey)
  }

  // static async bulidTransaction(data) {
  //   const keyProvider = EosService.getKeysByBrainkey(data.brainkey);
  //   const eos = EosPlayground({
  //     keyProvider : [
  //       eosAccounts['creator_private_key']
  //     ],
  //     httpEndpoint: eosConfig.httpEndpoint,
  //   });
  //
  //   let options = {broadcast: false};
  //
  //   eos.transfer({from: 'inita', to: 'initb', quantity: '1 SYS', memo: ''}, options).then(tr => console.log(JSON.stringify(tr)));
  // }

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

      const structs = res.abi.structs;

      const utc = structs.find(data => data.name === 'usertocont');

      console.log(utc);


      // console.log('Success: ', res.abi.structs);
    }).catch((err) => {
      console.log('error');
    })
  }


  static getActions(accountName) {
    eos.getActions(accountName).then((res) => {
      console.log(res);
    })
  }

  static sendTransaction () {
    const eos = EosPlayground({
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

  static privateToPublic(privateKey) {
    return ecc.privateToPublic(privateKey);
  }

}

module.exports = EosService;