const request = require('supertest');
const server = require('../../../app');

const Req = require('./request-helper');
const Res = require('./response-helper');

const accountsData = require('../../../config/accounts-data');

const BlockchainService       = require('../../../lib/eos/service').Blockchain;
const BlockchainModelProvider = require('../../../lib/eos/service').ModelProvider;

const BlockchainNodesRepository = require('../../../lib/eos/repository').Main;
const { TransactionSender } = require('uos-app-transaction');

const { WalletApi } = require('uos-app-wallet');


// TODO - move to WalletApiDictionary
const TR_TYPE__TRANSFER_FROM  = 10;
const TR_TYPE__TRANSFER_TO    = 11;
const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;
const TR_TYPE_CLAIM_EMISSION    = 50;

const TR_TYPE_BUY_RAM           = 60;
const TR_TYPE_SELL_RAM          = 61;

let accountName = 'vlad';
let privateKey = accountsData[accountName].activePk;

class BlockchainHelper {

  /**
   *
   * @return {string}
   */
  static getTesterAccountName() {
    return accountName;
  }
  /**
   *
   * @return {string}
   */
  static getTesterPrivateKey() {
    return privateKey;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<void>}
   */
  static async rollbackAllUnstakingRequests(accountName, privateKey) {
    const state = await WalletApi.getAccountState(accountName);

    if (state.resources.net.unstaking_request.amount === 0 && state.resources.cpu.unstaking_request.amount === 0) {
      console.warn('nothing to rollback');

      return;
    }

    const net = state.resources.net.tokens.self_delegated + state.resources.net.unstaking_request.amount;
    const cpu = state.resources.cpu.tokens.self_delegated + state.resources.cpu.unstaking_request.amount;

    await TransactionSender.stakeOrUnstakeTokens(accountName, privateKey, net, cpu);

    const stateAfter = await WalletApi.getAccountInfo(accountName);

    expect(stateAfter.resources.net.unstaking_request.amount).toBe(0);
    expect(stateAfter.resources.cpu.unstaking_request.amount).toBe(0);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<void>}
   */
  static async stakeSomethingIfNecessary(accountName, privateKey) {
    const accountState = await WalletApi.getAccountState(accountName);

    if (accountState.tokens.staked === 0) {
      await WalletApi.stakeOrUnstakeTokens(accountName, privateKey, 10, 10)
    }
  }

  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<Object>}
   */
  static resetVotingState(accountName, privateKey) {
    return WalletApi.voteForBlockProducers(accountName, privateKey, []);
  }

  static async mockGetBlockchainNodesWalletMethod(addToVote = {}, toDelete = true) {
    let {producerData:initialData, voters } = await WalletApi.getBlockchainNodes();

    voters = {
      ...voters,
      ...addToVote,
    };

    initialData.z_super_new1 = {
      title: 'z_super_new1',
      votes_count: 5,
      votes_amount: 100,
      currency: 'UOS',
      bp_status: 1,
    };

    initialData.z_super_new2 = {
      title: 'z_super_new2',
      votes_count: 5,
      votes_amount: 100,
      currency: 'UOS',
      bp_status: 1,
    };

    const created = [
      initialData.z_super_new1,
      initialData.z_super_new2
    ];

    // lets also change something
    const dataKeys = Object.keys(initialData);

    const deleted = [];
    if (toDelete) {
      deleted.push(dataKeys[0]);
    }

    const updated = [
      initialData[dataKeys[1]],
      initialData[dataKeys[2]],
    ];

    initialData[dataKeys[1]].votes_count = 10;
    initialData[dataKeys[1]].votes_amount = 250;

    initialData[dataKeys[2]].bp_status = 2;
    initialData[dataKeys[2]].votes_amount = 0;
    initialData[dataKeys[2]].votes_count = 0;

    deleted.forEach(index => {
      delete initialData[index];
    });

    WalletApi.getBlockchainNodes = async function () {
      return {
        voters,
        producerData: initialData,
      };
    };

    return {
      created,
      updated,
      deleted,
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {Promise<Object>}
   */
  static async getAllBlockchainNodes() {
    return BlockchainNodesRepository.findAllBlockchainNodes();
  }

  /**
   *
   * @return {Promise<void>}
   *
   */
  static async updateBlockchainNodes() {
    return await BlockchainService.updateBlockchainNodesByBlockchain();
  }

  /**
   * @return {Promise<Object>}
   *
   * @link BlockchainService#getAndProcessNodes
   */
  static async requestToGetNodesList(myself = null, withMyselfBpVote = false, expectedStatus = 200, searchString = '', allowEmpty = false) {
    const queryString = withMyselfBpVote ? '?myself_bp_vote=true' : '';
    let url = Req.getBlockchainNodesListUrl() + queryString + searchString;

    const req = request(server)
      .get(url)
    ;

    if (myself) {
      Req.addAuthToken(req, myself);
    }

    const res = await req;

    Res.expectStatusToBe(res, expectedStatus);

    if (expectedStatus !== 200) {
      return res.body;
    }

    Res.expectValidListResponse(res, allowEmpty);

    return res.body.data;
  }

  /**
   * @return {Promise<Object>}
   *
   * @link BlockchainService#getAndProcessMyselfBlockchainTransactions
   */
  static async requestToGetMyselfBlockchainTransactions(myself, expectedStatus = 200, queryString = '', allowEmpty = false) {
    let url = Req.getMyselfBlockchainTransactionsUrl();

    if (queryString) {
      url += `${queryString}`;
    }

    const req = request(server)
      .get(url)
    ;

    Req.addAuthToken(req, myself);

    const res = await req;

    Res.expectStatusToBe(res, expectedStatus);

    if (expectedStatus !== 200) {
      return res.body;
    }

    // TODO validate response list
    Res.expectValidListResponse(res, allowEmpty);

    return res.body.data;
  }

  /**
   *
   * @param models
   */
  static checkMyselfBlockchainTransactionsStructure(models) {
    const commonFields = [
      'updated_at',
      'tr_type',
      'memo'
    ];

    const trTypeToFieldSet = {
      [TR_TYPE_BUY_RAM]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_SELL_RAM]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE__TRANSFER_TO]: [
        'User',
        'memo',
        'tokens',
        // TODO validate inner object structure
      ],
      [TR_TYPE__TRANSFER_FROM]: [
        'User',
        'memo',
        'tokens',
        // TODO validate inner object structure
      ],
      [TR_TYPE_STAKE_RESOURCES]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_UNSTAKING_REQUEST]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_VOTE_FOR_BP]: [
        'producers'
        // TODO validate inner object structure
      ],
      [TR_TYPE_CLAIM_EMISSION]: [
        'tokens'
        // TODO validate inner object structure
      ],
    };

    models.forEach(model => {
      expect(model.tr_type).toBeDefined();

      const requiredFields = trTypeToFieldSet[model.tr_type];
      expect(requiredFields).toBeDefined();

      const expected = requiredFields.concat(commonFields);

      expect(Object.keys(model).sort()).toEqual(expected.sort());
    });
  }

  /**
   *
   * @param {Object[]} models
   * @param {boolean} isMyselfDataRequired
   */
  static checkManyProducers(models, isMyselfDataRequired = false) {
    models.forEach(model => {
      this.checkOneProducer(model, isMyselfDataRequired);
    });
  }

  /**
   *
   * @param {Object} model
   * @param {boolean} isMyselfDataRequired
   */
  static checkOneProducer(model, isMyselfDataRequired = false) {
    expect(model).toBeDefined();
    expect(model).not.toBeNull();
    expect(typeof model).toBe('object');

    const expected = BlockchainModelProvider.getFieldsForPreview();

    if (isMyselfDataRequired) {
      expected.push('myselfData');
    }

    const actual = Object.keys(model);
    expect(actual.sort()).toEqual(expected.sort());

    expect(typeof model.id).toBe('number');
    expect(model.id).toBeGreaterThan(0);

    expect(typeof model.title).toBe('string');
    expect(model.title.length).toBeGreaterThan(0);

    expect(typeof model.votes_count).toBe('number');
    expect(model.votes_count).toBeGreaterThanOrEqual(0);

    expect(typeof model.votes_amount).toBe('number');
    expect(model.votes_amount).toBeGreaterThanOrEqual(0);

    expect(model.currency).toBe('UOS');

    expect([1, 2]).toContain(model.bp_status);

    if (isMyselfDataRequired) {
      expect(model.myselfData).toBeDefined();
      expect(model.myselfData.bp_vote).toBeDefined();
      expect(typeof model.myselfData.bp_vote).toBe('boolean');
    }
  }
}

module.exports = BlockchainHelper;