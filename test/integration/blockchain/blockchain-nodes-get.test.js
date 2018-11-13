const helpers = require('../helpers');
const gen = require('../../generators');

const request = require('supertest');
const server = require('../../../app');


/**
 *
 * @param {Object} model
 * @param {boolean} isMyselfDataRequired
 */
function checkOneProducer(model, isMyselfDataRequired = false) {
  expect(model).toBeDefined();
  expect(model).not.toBeNull();
  expect(typeof model).toBe('object');

  const expected = [
    'id', 'title', 'votes_amount', 'votes_count', 'currency', 'url', 'bp_status',
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

  expect(typeof model.url).toBe('string');
  expect([1, 2]).toContain(model.bp_status);

  if (isMyselfDataRequired) {
    expect(model.myselfData).toBeDefined();
    expect(model.myselfData.bp_vote).toBeDefined();
    expect(typeof model.myselfData.bp_vote).toBe('boolean');
  }
}

describe('Blockchain nodes get', () => {
  it('Get nodes list without filters', async () => {
    const res = await request(server)
      .get('/api/v1/blockchain/nodes')
    ;

    helpers.Res.expectValidListResponse(res);

    const body = res.body;

    // check response structure
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);

    expect(body.metadata).toBeDefined();
    expect(typeof body.metadata).toBe('object');

    body.data.forEach(model => {
      checkOneProducer(model, true);
    });

    expect(res.status).toBe(200);
  });
});
