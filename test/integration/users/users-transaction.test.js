const helpers = require('../helpers');
const UsersRepository = require('../../../lib/users/repository');
const delay = require('delay');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

let userVlad;
let userJane;
let userPetr;

describe('Blockchain transactions', () => {

  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane(),
      helpers.UserHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  describe('Follow and Unfollow', () => {
    it('should process follow blockchain transaction by RabbitMq. It is supposed that unfollow will be the same', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

      let activity = null;

      while(!activity) {
        activity = await UsersRepository.ActivityUserUser.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(100);
      }

      expect(activity.blockchain_response.length).toBeGreaterThan(0);
      expect(activity.signed_transaction.length).toBeGreaterThan(0);
    }, 10000);
  });
});