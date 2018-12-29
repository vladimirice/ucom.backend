export {};

const mockHelper = require('../helpers/mock-helper');
const seedsHelper = require('../helpers/seeds-helper');

const tagsParser = require('../../../lib/tags/service/tags-parser-service.js');

describe('Tags services', () => {
  beforeAll(async () => {
    mockHelper.mockAllTransactionSigning();
    mockHelper.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await seedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    await seedsHelper.beforeAllRoutine();
  });

  describe('Mentions parser', () => {
    it('Mentions parser basic checks', async () => {
      const data = {
        '@summerknight@autumnknight @otto come here!' : [
          'summerknight', 'autumnknight',
        ],
        '@summerknight here are @autumnknight @otto come here!' : [
          'summerknight', 'autumnknight',
        ],
        '@summerknight here are @autumnknight2!' : [
          'summerknight', 'autumnknight',
        ],
      };

      for (const input in data) {
        const expected = data[input];
        const actual = tagsParser.parseMentions(input);

        expect(actual.length).toBe(expected.length);
        expect(actual).toMatchObject(expected);
      }
    });
  });
});
