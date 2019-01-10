export {};

const helpers = require('../helpers');
const usersRepository = require('../../../lib/users/repository');
const delay = require('delay');
const rabbitMqService = require('../../../lib/jobs/rabbitmq-service');

let userVlad;
let userJane;

describe('Blockchain transactions', () => {

  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
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
    // tslint:disable-next-line:max-line-length
    it('should process follow blockchain transaction by RabbitMq. It is supposed that unfollow will be the same', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

      let activity: any = null;

      while (!activity) {
        activity = await usersRepository.Activity.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(100);
      }

      expect(activity.blockchain_response.length).toBeGreaterThan(0);
      expect(activity.signed_transaction.length).toBeGreaterThan(0);
    }, 10000);

    it.skip('should get and process signed transaction from frontend', async () => {
    });
  });
});
