const helpers = require('../helpers');
const delay = require('delay');

const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const UsersRepositories = require('../../../lib/users/repository');
const UsersActivityRepository = UsersRepositories.Activity;

const { ContentTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');

let userVlad;
let userJane;
let userPetr;
let userRokky;
///
describe('Organizations. Blockchain transactions', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization creation - related blockchain transactions', () => {
    it('should process organization creation by RabbitMq.', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      const response = await helpers.Organizations.requestToCreateNewOrganization(userVlad);
      let activity = null;

      while(!activity) {
        activity = await UsersRepositories.Activity.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(500);
      }

      // noinspection JSUnresolvedFunction
      const expected = {
        activity_type_id: ContentTypeDictionary.getTypeOrganization(),
        activity_group_id: ActivityGroupDictionary.getGroupContentCreation(),
        user_id_from: userVlad.id,
        entity_id_to: response.id,
        entity_name: 'organizations'
      };

      // noinspection JSCheckFunctionSignatures
      activity.entity_id_to = parseInt(activity.entity_id_to);

      expect(activity.blockchain_status).toBe(1);

      expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedOrgTransaction());
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnOrgCreation());

      helpers.ResponseHelper.expectValuesAreExpected(expected, activity);
    }, 20000);
  });

  describe('Organization posting related transactions', () => {
    describe('Positive scenarios', () => {
      it('should create and process new organization media post transaction', async () => {
        await RabbitMqService.purgeBlockchainQueue();

        const user = userVlad;
        const org_id = 1;
        let activity = null;

        await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);
        while(!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
          await delay(100);
        }

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedOrgCreatesMediaPostTransaction());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnOrgCreatesMediaPost());
      }, 20000);
    });

    // it('should create and process new organization post offer transaction', async () => {
    //   // TODO
    // });
  });
});