export {};

const helpers = require('../helpers');
const delay = require('delay');

const rabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const usersRepositories = require('../../../lib/users/repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const activityGroupDictionary   = require('../../../lib/activity/activity-group-dictionary');
const usersActivityRepository   = require('../../../lib/users/repository').Activity;

let userVlad;
let userPetr;

describe('Organizations. Blockchain transactions', () => {
  beforeAll(async () => {
    [userVlad, , userPetr] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization creation - related blockchain transactions', () => {
    it('should process organization creation by RabbitMq.', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const response = await helpers.Organizations.requestToCreateNewOrganization(userVlad);
      let activity: any = null;

      while (!activity) {
        activity = await usersRepositories.Activity.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(100);
      }

      // noinspection JSUnresolvedFunction
      const expected = {
        activity_type_id: ContentTypeDictionary.getTypeOrganization(),
        activity_group_id: activityGroupDictionary.getGroupContentCreation(),
        user_id_from: userVlad.id,
        entity_id_to: response.id,
        entity_name: 'org       ',
      };

      // noinspection JSCheckFunctionSignatures
      activity.entity_id_to = +activity.entity_id_to;

      expect(activity.blockchain_status).toBe(1);

      expect(JSON.parse(activity.signed_transaction))
        .toMatchObject(helpers.EosTransaction.getPartOfSignedOrgTransaction());
      expect(JSON.parse(activity.blockchain_response))
        .toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnOrgCreation());

      helpers.ResponseHelper.expectValuesAreExpected(expected, activity);
    }, 20000);
  });

  describe('Organization following related transactions', () => {
    // tslint:disable-next-line:max-line-length
    it('should create and process valid organization following transaction. Unfollow should be the same', async () => {
      const orgId = 1;
      const user = userPetr;

      await rabbitMqService.purgeBlockchainQueue();
      await helpers.Org.requestToFollowOrganization(orgId, user);

      let activity: any = null;

      while (!activity) {
        activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.blockchain_response.length).toBeGreaterThan(0);
      expect(activity.signed_transaction.length).toBeGreaterThan(0);
    }, 30000);
  });
});
