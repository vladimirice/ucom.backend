const accountsData = require('../../config/accounts-data');
const { WalletApi } = require('ucom-libs-wallet');

WalletApi.setNodeJsEnv();
WalletApi.initForTestEnv();

class BlockchainTrGenerator {

  /**
   *
   * @param {string} accountAlias
   * @param {number} netToStake
   * @param {number} cpuToStake
   */
  static async createStakeOrUnstake(accountAlias, netToStake = 0, cpuToStake = 0) {
    const accountData = await this._checkUser(accountAlias);

    const state = await WalletApi.getAccountState(accountData.account_name);

    const net  = state.resources.net.tokens.self_delegated + netToStake;
    const cpu  = state.resources.cpu.tokens.self_delegated + cpuToStake;

    const res = await WalletApi.stakeOrUnstakeTokens(accountData.account_name, accountData.activePk, net, cpu);

    this._checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {Object} res
   * @private
   */
  static _checkIsTransactionOk(res) {
    expect(res).toBeDefined();
    expect(res.processed).toBeDefined();
    expect(typeof res.transaction_id).toBe('string');
    expect(res.transaction_id.length).toBeGreaterThan(0);
  }

  /**
   *
   * @param {string} accountAlias
   * @returns {Promise<Object>}
   * @private
   */
  static async _checkUser(accountAlias) {
    if (!accountsData[accountAlias]) {
      throw new Error(`object with key: ${accountAlias} must be presented inside accountsData.js`);
    }

    const accountData = accountsData[accountAlias];

    const state = await WalletApi.getAccountState(accountData.account_name);

    if (!state) {
      throw new Error(`There is no such account ${accountAlias}`);
    }

    return accountData;
  }
}

module.exports = BlockchainTrGenerator;