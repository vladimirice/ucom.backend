export {};

const helpers = require('../helpers');

helpers.Mock.mockAllBlockchainPart();

const tagsParser = require('../../../lib/tags/service/tags-parser-service.js');

describe('Create-update tags', () => {
  beforeAll(async () => {
    helpers.Mock.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('Tags parser', () => {
    it('Tags parser basic checks', async () => {
      const data = {
        '#null#null## hello there! I am amazing' : ['null'],
        '#null#undefined#undefined# hello! I #amazing #1tool:)' : ['null', 'undefined', 'amazing'],
      };

      for (const input in data) {
        const expected = data[input];
        const actual = tagsParser.parseTags(input);

        expect(actual.length).toBe(expected.length);
        expect(actual).toMatchObject(expected);
      }
    });
  });
});
