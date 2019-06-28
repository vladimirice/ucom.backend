import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import EosTransactionHelper = require('../helpers/eos-transaction-helpers');
import ResponseHelper = require('../helpers/response-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');

const delay = require('delay');
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const rabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const usersRepositories = require('../../../lib/users/repository');


const activityGroupDictionary   = require('../../../lib/activity/activity-group-dictionary');

let userVlad;
let userPetr;

describe('Organizations. Blockchain transactions', () => {
  beforeAll(async () => {
    [userVlad, , userPetr] = await SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization creation - related blockchain transactions', () => {
    it('should process organization creation by RabbitMq.', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
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
        entity_id_to: orgId,
        entity_name: OrganizationsModelProvider.getEntityName(),
      };

      // noinspection JSCheckFunctionSignatures
      activity.entity_id_to = +activity.entity_id_to;

      expect(activity.blockchain_status).toBe(1);

      expect(JSON.parse(activity.signed_transaction))
        .toMatchObject(EosTransactionHelper.getPartOfSignedOrgTransaction());
      expect(JSON.parse(activity.blockchain_response))
        .toMatchObject(EosTransactionHelper.getPartOfBlockchainResponseOnOrgCreation());

      ResponseHelper.expectValuesAreExpected(expected, activity);
    }, 20000);
  });

  describe('Organization following related transactions', () => {
    // tslint:disable-next-line:max-line-length
    it('should create and process valid organization following transaction. Unfollow should be the same', async () => {
      const orgId = 1;
      const user = userPetr;

      await rabbitMqService.purgeBlockchainQueue();
      await OrganizationsHelper.requestToFollowOrganization(orgId, user);

      let activity: any = null;

      while (!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.blockchain_response.length).toBeGreaterThan(0);
      expect(activity.signed_transaction.length).toBeGreaterThan(0);
    }, 30000);
  });
});

export {};
