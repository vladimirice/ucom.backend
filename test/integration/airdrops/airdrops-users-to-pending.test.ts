import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import OrganizationsHelper = require('../helpers/organizations-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import AirdropsUsersRepository = require('../../../lib/airdrops/repository/airdrops-users-repository');
import GithubRequest = require('../../helpers/github-request');
import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersExternalDataRepository = require('../../../lib/airdrops/repository/airdrops-users-external-data-repository');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

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

  describe('Users with no participation', () => {
    it('User fulfills all conditions and have a zero claim. He should be in participants list', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, false);

      // await AirdropsUsersToPendingService.process(airdropId);
      const manyUsersEmpty = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
      expect(manyUsersEmpty.data.length).toBe(0);

      const externalStateBefore = await AirdropsUsersExternalDataRepository.getOneFullyByUserId(userVlad.id);
      expect(externalStateBefore.are_conditions_fulfilled).toBeFalsy();

      await OrganizationsHelper.requestToFollowOrganization(orgId, userVlad);
      await AirdropsUsersToPendingService.process(airdropId);

      const externalState = await AirdropsUsersExternalDataRepository.getOneFullyByUserId(userVlad.id);

      expect(externalState.are_conditions_fulfilled).toBeTruthy();

      const manyUsersFilled = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
      expect(manyUsersFilled.data.length).toBe(1);

      expect(manyUsersFilled.data[0].id).toBe(userVlad.id);
    }, JEST_TIMEOUT_DEBUG);
  });

  describe('Positive', () => {
    beforeEach(async () => {
      await AirdropsUsersGenerator.generateForVladAndJane();
    });

    it('Process users one by one', async () => {
      const { airdrop, orgId, postId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

      const userVladData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdrop.id, userVlad, orgId, false);
      const userJaneData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdrop.id, userJane, orgId, false);

      await AirdropsUsersToPendingService.process(airdrop.id);

      // Nothing - no records about tokens
      await AirdropsUsersChecker.checkThatNoUserTokens(airdrop.id, userVlad.id);
      await AirdropsUsersChecker.checkThatNoUserTokens(airdrop.id, userJane.id);

      // Process vlad
      await OrganizationsHelper.requestToFollowOrganization(orgId, userVlad);
      await AirdropsUsersToPendingService.process(airdrop.id);

      // Vlad is processed but not Jane
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userVlad, postId, userVladData);
      await AirdropsUsersChecker.checkThatNoUserTokens(airdrop.id, userJane.id);

      // Process Jane also
      await OrganizationsHelper.requestToFollowOrganization(orgId, userJane);
      await AirdropsUsersToPendingService.process(airdrop.id);

      // No changes for Vlad
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userVlad, postId, userVladData);
      // New state for Jane
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userJane, postId, userJaneData);

      // Process again - should be no errors and no new states
      await AirdropsUsersToPendingService.process(airdrop.id);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userVlad, postId, userVladData);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userJane, postId, userJaneData);
    }, JEST_TIMEOUT * 100);

    it('Process both users', async () => {
      const { airdrop, orgId, postId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

      const userVladData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdrop.id, userVlad, orgId, true);
      const userJaneData =
        await AirdropsUsersGenerator.fulfillAirdropCondition(airdrop.id, userJane, orgId, true);

      await AirdropsUsersToPendingService.process(airdrop.id);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userVlad, postId, userVladData);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userJane, postId, userJaneData);

      // Try to process again - nothing new, no errors
      await AirdropsUsersToPendingService.process(airdrop.id);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userVlad, postId, userVladData);
      await AirdropsUsersChecker.checkGithubAirdropToPendingState(airdrop, userJane, postId, userJaneData);
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    it('Mark user as zero score holder', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);

      await AirdropsUsersToPendingService.process(airdropId);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const headers = RequestHelper.getGithubAuthHeader(sampleToken);
      // @ts-ignore
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      expect(oneUserAirdrop.score).toBe(0);
      expect(oneUserAirdrop.airdrop_status).toBe(6);

      const userVladState = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);
      expect(userVladState.length).toBe(0);
    });
  });
});

export {};
