// TODO Class is for playground only

const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);
const { ecc } = EosPlayground.modules;

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

  static privateToPublic(privateKey) {
    return ecc.privateToPublic(privateKey);
  }
}

module.exports = EosService;