const accountsData = require('../../config/accounts-data');
const { WalletApi } = require('ucom-libs-wallet');

WalletApi.setNodeJsEnv();
WalletApi.initForTestEnv();

class BlockchainTrGenerator {

  /**
   *
   * @param {string} accountAlias
   * @param {string[]} producers
   * @returns {Promise<string>} transaction ID
   */
  static async createVoteForBp(accountAlias, producers) {
    const accountsData = await this.checkUser(accountAlias);

    const res = await WalletApi.voteForBlockProducers(
      accountsData.account_name,
      accountsData.activePk,
      producers,
    );
    this.checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {string} accountAlias
   * @param {number} bytesAmount
   * @returns {Promise<string>}
   */
  static async createBuyRam(accountAlias, bytesAmount) {
    const accountsData = await this.checkUser(accountAlias);

    const res = await WalletApi.buyRam(
      accountsData.account_name,
      accountsData.activePk,
      bytesAmount,
    );
    this.checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {string} accountAlias
   * @param {number} bytesAmount
   * @returns {Promise<string>}
   */
  static async createSellRam(accountAlias, bytesAmount) {
    const accountsData = await this.checkUser(accountAlias);

    const res = await WalletApi.sellRam(
      accountsData.account_name,
      accountsData.activePk,
      bytesAmount,
    );
    this.checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {string} accountAliasFrom
   * @param {string} accountAliasTo
   * @param {number} amount
   * @returns {Promise<string>} transaction ID
   */
  static async createTokenTransfer(accountAliasFrom, accountAliasTo, amount) {
    const accountDataFrom = await this.checkUser(accountAliasFrom);
    const accountDataTo   = await this.checkUser(accountAliasTo);

    const res = await WalletApi.sendTokens(
      accountDataFrom.account_name,
      accountDataFrom.activePk,
      accountDataTo.account_name,
      amount,
    );
    this.checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {string} accountAlias
   * @param {number} netToStake
   * @param {number} cpuToStake
   *
   * @return {Promise<string>} transaction ID
   */
  static async createStakeOrUnstake(accountAlias, netToStake = 0, cpuToStake = 0) {
    const accountData = await this.checkUser(accountAlias);

    const state = await WalletApi.getAccountState(accountData.account_name);

    const net  = state.resources.net.tokens.self_delegated + netToStake;
    const cpu  = state.resources.cpu.tokens.self_delegated + cpuToStake;

    const res = await WalletApi.stakeOrUnstakeTokens(
      accountData.account_name,
      accountData.activePk,
      net,
      cpu,
    );

    this.checkIsTransactionOk(res);

    return res.transaction_id;
  }

  /**
   *
   * @param {Object} res
   * @private
   */
  static checkIsTransactionOk(res) {
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
  static async checkUser(accountAlias) {
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

export = BlockchainTrGenerator;
