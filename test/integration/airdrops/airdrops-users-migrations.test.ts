import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import AirdropUsersMigrateService = require('../../../lib/airdrops/service/maintenance/airdrop-users-migrate-service');
import { GraphqlHelper } from '../helpers/graphql-helper';
import CommonChecker = require('../../helpers/common/common-checker');
import AirdropsDatabaseDirectChanges = require('../../helpers/airdrops-database-direct-changes');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Airdrops users migrations', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('migrations from github airdrop round one to round two', async () => {
      // Vlad has a tokens from the table, jane has a zero score.
      await AirdropsUsersGenerator.generateGithubRawDataForVlad();
      await AirdropsUsersGenerator.generateGithubRawDataForVladRoundTwo();

      // create two airdrops. first airdrop is run, second airdrop must be in `not started yet`
      const { airdrop: firstRoundAirdrop, postId, orgId } =
        await AirdropsGenerator.createNewAirdrop(userVlad);

      const { airdrop: secondRoundAirdrop } =
        await AirdropsGenerator.createNewGithubRoundTwo(userVlad, 1);

      const userVladData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(firstRoundAirdrop.id, userVlad, orgId, true);
      // const userJaneData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(firstRoundAirdrop.id, userJane, orgId, true);

    /*
        * Vlad and Jane participates only in the first airdrop - just run the process and ensure that all of them are in the participants list
        * Set status received and no participation manually
        * to-pending - No participation for the second airdrop but users are prepared and are in participants list
        *
        * TODO
        * directly set started at in order to first airdrop to be in `in process`
        * process by the pending worker again
        * validate a correct pending state for the vlad and jane
        *
     */

      await AirdropsUsersToPendingService.processAllInProcessAirdrop();

      // Vlad is processed but not Jane
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(firstRoundAirdrop.id, userVlad.id, postId, userVladData);
      await AirdropsUsersChecker.checkThatNoUserTokens(secondRoundAirdrop.id, userJane.id);

      await AirdropsDatabaseDirectChanges.setAirdropStatusReceived(userVlad);
      await AirdropUsersMigrateService.migrateFromFirstRoundToSecond(firstRoundAirdrop.id, secondRoundAirdrop.id);

      const secondAirdropParticipants = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, secondRoundAirdrop.id);

      CommonChecker.expectOnlyTwoArrayItemForTheList(secondAirdropParticipants);
      await AirdropsUsersToPendingService.processAllInProcessAirdrop();
      await AirdropsUsersChecker.checkThatNoUserTokens(secondRoundAirdrop.id, userVlad.id);
      await AirdropsUsersChecker.checkThatNoUserTokens(secondRoundAirdrop.id, userJane.id);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
