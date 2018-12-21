const _ = require('lodash');
const gen = require('../../generators');

const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const postsModelProvider = require('../../../lib/posts/service/posts-model-provider.js');

const helpers = require('../helpers');

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockAllTransactionSigning();
helpers.Mock.mockAllBlockchainJobProducers();

describe('Tags parser consumer', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
    await RabbitMqService.purgeTagsParserQueue();
  });

  describe('Positive', () => {
    it('should process post creation event', async () => {
      const user = userVlad;

      const expectedTags = [
        'hello',
        'amazing'
      ];

      const values = {
        description: `#${expectedTags[0]} there! I am #${expectedTags[1]}`,
      };

      const modelId = await gen.Posts.createMediaPostByUserHimself(user, values);

      const processedModel = await helpers.Tags.getPostWhenTagsAreProcessed(modelId);

      await helpers.Tags.checkRelatedModels(expectedTags, processedModel, postsModelProvider.getEntityName());

    }, 10000);

    it.skip('If no tags - do nothing', async () => {
      // TODO
    });

    it.skip('Process only one tag', async () => {
      // TODO
    });

    it.skip('Process many tags', async () => {
      // TODO
    });

    it.skip('should produce no tags records if there are no ones for new post', async () => {

    });
  });
});