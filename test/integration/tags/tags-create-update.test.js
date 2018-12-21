const helpers = require('../helpers');
const gen     = require('../../generators');

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

const _ = require('lodash');

const TagsParser = require('../../../lib/tags/service/tags-parser-service.js');

describe('Create-update tags', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  afterAll(async () => { await helpers.Seeds.doAfterAll(); });


  describe('Tags parser', () => {
    it('Tags parser basic checks', async () => {
      const data = {
        '#null#null## hello there! I am amazing' : ['null'],
        '#null#undefined#undefined# hello there! I am #amazing #1tool:)' : ['null', 'undefined', 'amazing'],
      };

      for (const input in data) {
        const expected = data[input];
        const actual = TagsParser.parseTags(input);

        expect(actual.length).toBe(expected.length);
        expect(actual).toMatchObject(expected);
      }
    })
  });
});
