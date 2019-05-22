import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import SeedsHelper = require('../helpers/seeds-helper');
import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import GithubRequest = require('../../helpers/github-request');
import UsersExternalRequest = require('../../helpers/users-external-request');
import OrganizationsHelper = require('../helpers/organizations-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersRequest = require('../../helpers/airdrops-users-request');
import AuthService = require('../../../lib/auth/authService');
import AirdropsUsersExternalDataService = require('../../../lib/airdrops/service/airdrops-users-external-data-service');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Airdrops one user', () => {
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
    beforeEach(async () => {
      await AirdropsUsersGenerator.generateForVladAndJane();
    });

    it('Auth conditions are true after pairing but without github token', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(githubToken);

      const headers = RequestHelper.getAuthBearerHeader(<string>userVlad.token);

      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, githubToken);
      const response = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      const conditions = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: false,
      };

      const expectedAirdrop =
        await AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditions, userVlad.id);

      expect(response).toMatchObject(expectedAirdrop);
    });

    it('get user airdrop conditions and modify them step by step', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken: string = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(githubToken);

      const headers = {};
      const guestAirdropState = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);
      AirdropsUsersChecker.checkGithubAirdropGuestState(guestAirdropState);

      RequestHelper.addGithubAuthHeader(headers, githubToken);

      const userAirdropWithGithub = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      const conditions = {
        auth_github: true,
        auth_myself: false,
        following_devExchange: false,
      };

      const expectedUserAirdropWithGithub =
        await AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditions);

      expect(userAirdropWithGithub).toMatchObject(
        expectedUserAirdropWithGithub,
      );

      RequestHelper.addAuthBearerHeader(headers, <string>userVlad.token);

      const userAirdropWithAllAuth = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      // here auth_github should be false because if bearer then link is required
      const conditionsAllAuth = {
        auth_github: false,
        auth_myself: true,
        following_devExchange: false,
      };

      const expectedAirdropSecond =
        await AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllAuth, userVlad.id);

      expect(userAirdropWithAllAuth).toMatchObject(expectedAirdropSecond);

      // make pairing and check again
      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, githubToken);

      const userAirdropWithPairing = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      // here auth_github should be false because if bearer then link is required
      const conditionsAllAuthAndPairing = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: false,
      };

      const expectedAirdropWithPairing =
        await AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllAuthAndPairing, userVlad.id);

      expect(userAirdropWithPairing).toMatchObject(expectedAirdropWithPairing);

      // Lets follow required community and expect following condition = true
      await OrganizationsHelper.requestToCreateOrgFollowHistory(userVlad, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const userAirdropWithAllTrue = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      const conditionsAllTrue = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: true,
      };

      const expectedUserAirdropWithAllTrue =
        await AirdropsUsersGenerator.getExpectedUserAirdrop(
          airdropId,
          usersExternalId,
          conditionsAllTrue,
          userVlad.id,
          AirdropStatuses.PENDING,
        );

      expect(userAirdropWithAllTrue).toMatchObject(expectedUserAirdropWithAllTrue);

      // Lets UNfollow required community and expect following condition = true
      await OrganizationsHelper.requestToUnfollowOrganization(orgId, userVlad);
      const userAirdropWithUnfollowedOrg = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);


      const expectedUserAirdropWithUnfollowedOrg = await AirdropsUsersGenerator.getExpectedUserAirdrop(
        airdropId,
        usersExternalId,
        conditionsAllAuthAndPairing,
        userVlad.id,
        AirdropStatuses.PENDING, // after processing it is not possible to change status to new
      );


      expect(userAirdropWithUnfollowedOrg).toMatchObject(expectedUserAirdropWithUnfollowedOrg);
    }, JEST_TIMEOUT);

    it('get user state via github token', async () => {
      const { airdropId, airdrop } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(sampleToken);

      const sampleAirdropData = await AirdropsUsersExternalDataService.getUsersExternalData(
        airdrop,
        usersExternalId,
        AirdropsUsersRequest.getVladGithubId(),
        true,
      );

      const headers = RequestHelper.getGithubAuthHeader(sampleToken);
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdrop);

      expect(oneUserAirdrop.tokens).toMatchObject(sampleAirdropData.tokens);

      // fetch again - no error
      const oneUserAirdropSecond = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);
      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdropSecond);

      expect(oneUserAirdropSecond.tokens).toMatchObject(sampleAirdropData.tokens);
    });

    it('get user state WITHOUT pairing via auth token', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdropViaAuthToken(userVlad, airdropId);

      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdrop);

      AirdropsUsersChecker.checkGithubAirdropNoTokensState(oneUserAirdrop, userVlad.id);
    });

    it('get user state WITH pairing via auth token', async () => {
      const { airdropId, airdrop } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(githubToken);

      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, githubToken);

      const sampleAirdropData = await AirdropsUsersExternalDataService.getUsersExternalData(
        airdrop,
        usersExternalId,
        AirdropsUsersRequest.getVladGithubId(),
        true,
      );

      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdropViaAuthToken(userVlad, airdropId);
      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdrop);
      AirdropsUsersChecker.checkGithubAirdropState(oneUserAirdrop, sampleAirdropData);

      // ask again - no error, same response
      const oneUserAirdropAgain = await GraphqlHelper.getOneUserAirdropViaAuthToken(userVlad, airdropId);
      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdropAgain);
      AirdropsUsersChecker.checkGithubAirdropState(oneUserAirdropAgain, sampleAirdropData);
    }, JEST_TIMEOUT_DEBUG);
  });

  describe('Negative', () => {
    it('If there are no tokens to send then status should be no participation', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);

      const headers = RequestHelper.getGithubAuthHeader(sampleToken);
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      AirdropsUsersChecker.checkGithubAirdropNoParticipationState(oneUserAirdrop);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
