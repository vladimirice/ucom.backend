const request = require('supertest');
const server = require('../../../app');

const Req = require('./request-helper');
const Res = require('./response-helper');

const BlockchainService = require('../../../lib/eos/service').Blockchain;
const BlockchainNodesRepository = require('../../../lib/eos/repository').Main;

const { WalletApi } = require('uos-app-wallet');

class BlockchainHelper {
  static async mockGetBlockchainNodesWalletMethod() {
    let initialData = await WalletApi.getBlockchainNodes();

    initialData.z_super_new1 = {
      title: 'z_super_new1',
      votes_count: 5,
      votes_amount: 100,
      currency: 'UOS',
      bp_status: 1,
    };


    const created = [
      initialData.z_super_new1
    ];

    // lets also change something
    const dataKeys = Object.keys(initialData);

    const deleted = [
      dataKeys[0]
    ];

    const updated = [
      initialData[dataKeys[1]],
      initialData[dataKeys[2]],
    ];

    initialData[dataKeys[1]].votes_count = 10;
    initialData[dataKeys[1]].votes_amount = 250;

    initialData[dataKeys[2]].bp_status = 2;
    initialData[dataKeys[2]].votes_amount = 0;
    initialData[dataKeys[2]].votes_count = 0;

    delete initialData[dataKeys[0]];

    WalletApi.getBlockchainNodes = async function () {
      return initialData;
    };

    return {
      created,
      updated,
      deleted,
    }
  }

  /**
   *
   * @return {Promise<Object>}
   */
  static async getAllBlockchainNodes() {
    return BlockchainNodesRepository.findAllBlockchainNodes(true);
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
  static async requestToGetNodesList(myself = null, withMyselfBpVote = false, expectedStatus = 200) {
    const queryString = withMyselfBpVote ? '?myself_bp_vote=true' : '';
    let url = Req.getBlockchainNodesListUrl() + queryString;

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

    Res.expectValidListResponse(res);

    return res.body.data;
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

    const expected = [
      'id', 'title', 'votes_amount', 'votes_count', 'currency', 'bp_status',
    ];

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