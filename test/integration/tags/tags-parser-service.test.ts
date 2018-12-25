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
        '#null#undefined!#undefined2!# #a #b2 hello! #a998bc I #amazing #1tool:) #too.l:)' :
          ['null', 'undefined', 'undefined2', 'a', 'b2', 'a998bc', 'amazing', 'too'],
        '#null#null## hello there! I am amazing' : ['null'],
        '#null2 hello! #undefined! I #ama2zing90 #1tool:)' : ['null2', 'undefined', 'ama2zing90'],
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
