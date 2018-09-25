const helpers = require('../helpers');
const delay = require('delay');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const UsersRepositories = require('../../../lib/users/repository');

const request = require('supertest');
const server = require('../../../app');

let userVlad;
let userJane;
let userPetr;
let userRokky;
///
describe('Organizations. Blockchain transactions', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('Organization creation - related blockchain transactions', () => {
    it('should process organization creation by RabbitMq.', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      await helpers.Organizations.requestToCreateNewOrganization(userVlad);

      let activity = null;

      while(!activity) {
        activity = await UsersRepositories.Activity.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(500);
      }

      expect(activity.blockchain_response.length).toBeGreaterThan(0);
      expect(activity.signed_transaction.length).toBeGreaterThan(0);
    }, 5000);
  });

});