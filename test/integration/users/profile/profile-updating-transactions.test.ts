import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import ActivityGroupDictionary = require('../../../../lib/activity/activity-group-dictionary');
import CommonChecker = require('../../../helpers/common/common-checker');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { ContentApi } = require('ucom-libs-wallet');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'nothing',
};

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Existing profile updating in the blockchain', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Check only transaction saving and activity', async () => {
      const updatedProfile = {
        about: 'Hi there. Here I am!',
      };

      const signedTransaction = await ContentApi.updateProfile(
        userVlad.account_name,
        userVlad.private_key,
        updatedProfile,
      );

      // @ts-ignore
      const updatedUser = await OneUserRequestHelper.updateMyself(userVlad, {
        ...updatedProfile,
        signed_transaction: signedTransaction,
      });

      CommonChecker.expectFieldIsStringDateTime(updatedUser, 'profile_updated_at');

      const eventId = EventsIds.userUpdatesProfile();

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id:   ActivityGroupDictionary.getUserProfile(),
          activity_group_id:  ActivityGroupDictionary.getUserProfile(),
          user_id_from:       userVlad.id,
          entity_id_to:       userVlad.id,
          entity_name:        UsersModelProvider.getEntityName(),
          event_id:           eventId,
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);
      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT * 3);
  });
});

export {};
