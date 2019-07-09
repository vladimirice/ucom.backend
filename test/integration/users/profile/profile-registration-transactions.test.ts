import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import UserProfileRequest = require('../../../helpers/users/user-profile-request');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import ActivityGroupDictionary = require('../../../../lib/activity/activity-group-dictionary');
import CommonChecker = require('../../../helpers/common/common-checker');
import moment = require('moment');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');

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

describe('Profile after registration', () => {
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
      const isTrackingAllowed = true;
      const userCreatedAt = moment().utc().format();

      const signedTransaction = await ContentApi.createProfileAfterRegistration(
        userVlad.account_name,
        userVlad.private_key,
        isTrackingAllowed,
        userCreatedAt,
      );

      await UserProfileRequest.sendNewProfileTransaction(
        userVlad,
        signedTransaction,
      );

      const eventId = EventsIds.userCreatesProfile();

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

  describe('Negative', () => {
    it('It is required to attach a signed transaction after the registration', async () => {
      await UserProfileRequest.sendNewProfileTransaction(userVlad, '', 400);
    });
  });
});

export {};
