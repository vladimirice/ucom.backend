const request = require('supertest');
const server = require('../../../app');

const Req = require('./request-helper');
const Res = require('./response-helper');

class BlockchainHelper {
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