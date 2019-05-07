import RequestHelper = require('../helpers/request-helper');

export {};

const helpers = require('../helpers');

const request = require('supertest');
const server = RequestHelper.getApiApplication();

describe('Blockchain uniqid generator', () => {

  describe('Positive scenarios', () => {
    it('should get new uniqid', async () => {
      const res = await request(server)
        .post(helpers.Req.getBlockchainContentUniqidUrl())
        .field('scope', 'organizations')
      ;

      helpers.Res.expectStatusCreated(res);
      const body = res.body;

      expect(body.uniqid.length).toBeGreaterThan(0);
      expect(body.uniqid_signature.length).toBeGreaterThan(0);
    });
  });
});
