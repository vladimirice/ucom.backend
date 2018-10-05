const helpers = require('../helpers');
const delay = require('delay');

const RabbitMqService         = require('../../../lib/jobs/rabbitmq-service');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Comment related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initPostOfferSeeds();
  });

  describe('User himself. Media post creation', () => {
    it('should create and process valid transaction', async () => {
      // TODO
    });
  });

});