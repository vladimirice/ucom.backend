import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import OrganizationsHelper = require('../helpers/organizations-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import AirdropUsersMigrateService = require('../../../lib/airdrops/service/maintenance/airdrop-users-migrate-service');

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

      // create two airdrops. first airdrop is run, second airdrop must be in `not started yet`
      const { airdropId, postId, orgId } =
        await AirdropsGenerator.createNewAirdrop(userVlad);

      const { airdropId: secondRoundAirdropId } =
        await AirdropsGenerator.createNewGithubRoundTwo(userVlad, 1);

      const userVladData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
      const userJaneData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, true);

      /*
* Vlad and Jane participates only in the first airdrop - just run the process and ensure that all of them are in the participants list
* Set status received and no participation manually
* to-pending - No participation for the second airdrop but users are prepared and are in participants list
* directly set started at in order to first airdrop to be in `in process`
* process by the pending worker again
* validate a correct pending state for the vlad and jane
 */

      await AirdropsUsersToPendingService.processAllInProcessAirdrop();

      // Vlad is processed but not Jane
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
      await AirdropsUsersChecker.checkThatNoUserTokens(secondRoundAirdropId, userJane.id);

      await AirdropUsersMigrateService.migrateFromFirstRoundToSecond(airdropId, secondRoundAirdropId);

      // TODO


      return;

      // Process Jane also
      await OrganizationsHelper.requestToFollowOrganization(orgId, userJane);
      await AirdropsUsersToPendingService.process(airdropId);

      // No changes for Vlad
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
      // New state for Jane
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userJane.id, postId, userJaneData);

      // Process again - should be no errors and no new states
      await AirdropsUsersToPendingService.process(airdropId);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userJane.id, postId, userJaneData);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
