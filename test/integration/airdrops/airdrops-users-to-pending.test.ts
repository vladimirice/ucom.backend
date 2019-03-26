import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import OrganizationsHelper = require('../helpers/organizations-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;

describe('Airdrops users to pending', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  it('Process users one by one', async () => {
    const { airdropId, orgId, postId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    const userVladData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, false);
    const userJaneData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, false);

    await AirdropsUsersToPendingService.process(airdropId);

    // Nothing - no records about tokens
    await AirdropsUsersChecker.checkThatNoUserTokens(airdropId, userVlad.id);
    await AirdropsUsersChecker.checkThatNoUserTokens(airdropId, userJane.id);

    // Process vlad
    await OrganizationsHelper.requestToFollowOrganization(orgId, userVlad);
    await AirdropsUsersToPendingService.process(airdropId);

    // Vlad is processed but not Jane
    await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
    await AirdropsUsersChecker.checkThatNoUserTokens(airdropId, userJane.id);

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
  }, JEST_TIMEOUT * 100);

  it('Process both users', async () => {
    const { airdropId, orgId, postId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    const userVladData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
    const userJaneData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, true);

    await AirdropsUsersToPendingService.process(airdropId);
    await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
    await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userJane.id, postId, userJaneData);

    // Try to process again - nothing new, no errors
    await AirdropsUsersToPendingService.process(airdropId);
    await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userVlad.id, postId, userVladData);
    await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdropId, userJane.id, postId, userJaneData);
  }, JEST_TIMEOUT);
});

export {};
