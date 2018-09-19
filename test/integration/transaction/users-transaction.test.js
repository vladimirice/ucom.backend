const helpers = require('../helpers');
const UsersRepository = require('../../../lib/users/repository');
const delay = require('delay');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

const ActivityTypeDictionary = require('../../../lib/activity/activity-types-dictionary');

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
    it('should create user follows user transaction record', async () => {
      await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

      const transactionData = await UsersRepository.ActivityUserUser.findLastByUserId(userVlad.id);
      expect(transactionData).not.toBeNull();

      const expectedFields = {
        'activity_type_id': ActivityTypeDictionary.getFollowId(),
        'blockchain_status': 0,
        'user_id': userVlad.id
      };

      helpers.ResponseHelper.expectValuesAreExpected(expectedFields, transactionData);
    }, 10000);
    it('should create user unfollows user transaction record', async () => {
      await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);
      await helpers.ActivityHelper.requestToCreateUnfollow(userVlad, userJane);

      const transactionData = await UsersRepository.ActivityUserUser.findLastByUserId(userVlad.id);
      expect(transactionData).not.toBeNull();

      expect(transactionData.signed_transaction).not.toBeNull();
      expect(transactionData.signed_transaction.length).toBeGreaterThan(0);
      expect(transactionData.blockchain_status).toBe(0);
    }, 15000);

    it('should process follow blockchain transaction by RabbitMq', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

      // let processedTransaction = null;

      // while(!processedTransaction) {
      //   processedTransaction = await UsersRepository.Transaction.findLastProcessedTransactionByUserId(userVlad.id);
      //   await delay(500);
      // }
      // TODO
    }, 10000);

    it('should process unfollow blockchain transaction by RabbitMq', async () => {
      // TODO
    });


  });


});