import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');

import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import GithubRequest = require('../../helpers/github-request');
import UsersExternalRequest = require('../../helpers/users-external-request');
import OrganizationsHelper = require('../helpers/organizations-helper');
import PostsHelper = require('../helpers/posts-helper');
import CommonHelper = require('../helpers/common-helper');
import PostsOfferChecker = require('../../helpers/posts-offer-checker');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersRequest = require('../../helpers/airdrops-users-request');
import AuthService = require('../../../lib/auth/authService');
import AirdropsUsersExternalDataService = require('../../../lib/airdrops/service/airdrops-users-external-data-service');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;

describe('Airdrops create-get', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Github airdrop creation', () => {
    it('create valid airdrop with related accounts', async () => {
      const {
        airdropId, postId, startedAt, finishedAt, expectedTokens,
      } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const postOffer = await GraphqlHelper.getOnePostOfferWithoutUser(postId);

      const options = CommonHelper.getOptionsForListAndGuest();
      PostsHelper.checkMediaPostFields(postOffer, options);

      PostsOfferChecker.checkGithubAirdropOffer(
        postOffer,
        airdropId,
        expectedTokens,
        startedAt,
        finishedAt,
      );
    }, JEST_TIMEOUT);
  });

  describe('Get airdrop', () => {
    it('get both post offer data and airdrop state via github token', async () => {
      const { postId, airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken();

      const headers = RequestHelper.getGithubAuthHeader(githubToken);
      const res = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        headers,
      );

      const options = CommonHelper.getOptionsForListAndGuest();
      PostsOfferChecker.checkGithubAirdropOfferStructure(res.data.one_post_offer, options);

      AirdropsUsersChecker.checkAirdropsStructure(res.data.one_user_airdrop);
    });

    it('get both post offer data and airdrop state via auth token', async () => {
      const { postId, airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const headers = RequestHelper.getAuthBearerHeader(<string>userVlad.token);
      const res = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        headers,
      );

      const options = CommonHelper.getOptionsForListAndGuest();
      PostsOfferChecker.checkGithubAirdropOfferStructure(res.data.one_post_offer, options);

      AirdropsUsersChecker.checkAirdropsStructure(res.data.one_user_airdrop);
    });
  });

  describe('User himself state', () => {
    it('get user airdrop conditions and modify them step by step', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken: string = await GithubRequest.sendSampleGithubCallbackAndGetToken();
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

      expect(userAirdropWithGithub).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditions),
      );

      RequestHelper.addAuthBearerHeader(headers, <string>userVlad.token);

      const userAirdropWithAllAuth = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      // here auth_github should be false because if bearer then link is required
      const conditionsAllAuth = {
        auth_github: false,
        auth_myself: true,
        following_devExchange: false,
      };

      expect(userAirdropWithAllAuth).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllAuth, userVlad.id),
      );

      // make pairing and check again
      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, githubToken);

      const userAirdropWithPairing = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      // here auth_github should be false because if bearer then link is required
      const conditionsAllAuthAndPairing = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: false,
      };

      expect(userAirdropWithPairing).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllAuthAndPairing, userVlad.id),
      );

      // Lets follow required community and expect following condition = true
      await OrganizationsHelper.requestToCreateOrgFollowHistory(userVlad, orgId);

      const userAirdropWithAllTrue = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      const conditionsAllTrue = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: true,
      };

      expect(userAirdropWithAllTrue).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllTrue, userVlad.id),
      );

      // Lets UNfollow required community and expect following condition = true
      await OrganizationsHelper.requestToUnfollowOrganization(orgId, userVlad);
      const userAirdropWithUnfollowedOrg = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      expect(userAirdropWithUnfollowedOrg).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditionsAllAuthAndPairing, userVlad.id),
      );
    }, JEST_TIMEOUT);

    it('get user state via github token', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken();
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(sampleToken);

      const sampleAirdropData = await AirdropsUsersExternalDataService.getSampleUsersExternalData(
        airdropId,
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
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken();
      const usersExternalId: number = AuthService.extractUsersExternalIdByTokenOrError(githubToken);

      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, githubToken);

      const sampleAirdropData = await AirdropsUsersExternalDataService.getSampleUsersExternalData(
        airdropId,
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
    }, JEST_TIMEOUT * 100);
  });
});

export {};
