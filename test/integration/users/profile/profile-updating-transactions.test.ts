import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import CommonChecker = require('../../../helpers/common/common-checker');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');
import UsersProfileRequest = require('../../../helpers/users/profile/users-profile-request');
import ExistingProfilesProcessor = require('../../../../lib/users/profile/service/existing-profiles-processor');
import UsersProfileChecker = require('../../../helpers/users/profile/users-profile-checker');

const { ContentApi } = require('ucom-libs-wallet');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

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
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
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

      const updatedUser = await OneUserRequestHelper.updateMyself(userVlad, {
        ...updatedProfile,
        signed_transaction: signedTransaction,
      });

      CommonChecker.expectFieldIsStringDateTime(updatedUser, 'profile_updated_at');

      await UsersProfileChecker.checkProfileUpdating(userVlad);
    }, JEST_TIMEOUT * 3);

    it('process existing profiles without transactions', async () => {
      await UsersProfileRequest.sendProfileAfterRegistrationForUser(userVlad);

      const processed = await ExistingProfilesProcessor.process();

      expect(processed.totalProcessedCounter).toBe(3);
      expect(processed.totalSkippedCounter).toBe(0);

      for (const user of [userJane, userPetr, userRokky]) {
        await UsersProfileChecker.checkProfileUpdating(user);
      }
    }, JEST_TIMEOUT * 6);
  });
});

export {};
