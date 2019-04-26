import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

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
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import _ = require('lodash');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;

// @ts-ignore
const JEST_TIMEOUT_DEBUG = 1000 * 1000;

let generatedForVlad;
// @ts-ignore
let generatedForJane;

describe('Airdrops create-get', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();

    [generatedForVlad, generatedForJane] = await AirdropsUsersGenerator.generateForVladAndJane();
  });

  describe('Airdrops users data from github raw data table', () => {
    it('Check validity', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
      const headers = RequestHelper.getGithubAuthHeader(sampleToken);
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdrop);

      expect(oneUserAirdrop.score).toBe(generatedForVlad.score);
      expect(oneUserAirdrop.tokens[0].amount_claim).toBe(generatedForVlad.amount);
      expect(oneUserAirdrop.tokens[1].amount_claim).toBe(generatedForVlad.amount);

      // fetch again - no error
      const oneUserAirdropSecond = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);
      AirdropsUsersChecker.checkAirdropsStructure(oneUserAirdropSecond);

      expect(oneUserAirdrop.score).toBe(generatedForVlad.score);
      expect(oneUserAirdrop.tokens[0].amount_claim).toBe(generatedForVlad.amount);
      expect(oneUserAirdrop.tokens[1].amount_claim).toBe(generatedForVlad.amount);
    });
  });

  describe('Github airdrop participants', () => {
    it('Get many participants as separate request', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);
      const manyUsersEmpty = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
      expect(manyUsersEmpty.data.length).toBe(0);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const manyUsersVladOnly = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
      expect(manyUsersVladOnly.data.length).toBe(1);

      const options = {
        author: {
          myselfData: true,
        },
        airdrops: {},
      };

      CommonHelper.checkUsersListResponse(manyUsersVladOnly, options);

      expect(manyUsersVladOnly.data[0].external_login).toBe('vladimirice');
      expect(manyUsersVladOnly.data[0].score).toBeGreaterThan(0);

      expect(manyUsersVladOnly.metadata.total_amount).toBe(1);
      expect(manyUsersVladOnly.metadata.has_more).toBeFalsy();

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const manyUsers = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
      expect(manyUsers.data.length).toBe(2);

      const vladResponse = manyUsers.data.find(item => item.account_name === userVlad.account_name);
      const janeResponse = manyUsers.data.find(item => item.account_name === userJane.account_name);

      expect(vladResponse.external_login).toBe('vladimirice');
      expect(vladResponse.score).toBeGreaterThan(0);

      expect(janeResponse.external_login).toBe('akegaviar');
      expect(janeResponse.score).toBeGreaterThan(0);

      expect(manyUsers.metadata.total_amount).toBe(2);
      expect(manyUsers.metadata.has_more).toBeFalsy();
    }, JEST_TIMEOUT);

    it('Smoke - Check pagination', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const manyUsersFirstPage = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId, '-score', 1, 1);

      expect(manyUsersFirstPage.data.length).toBe(1);

      const vladResponse = manyUsersFirstPage.data.find(item => item.account_name === userVlad.account_name);
      expect(_.isEmpty(vladResponse)).toBeFalsy();

      expect(manyUsersFirstPage.metadata.total_amount).toBe(2);
      expect(manyUsersFirstPage.metadata.has_more).toBeTruthy();
      expect(manyUsersFirstPage.metadata.page).toBe(1);
      expect(manyUsersFirstPage.metadata.per_page).toBe(1);

      const manyUsersSecondPage = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId, '-score', 2, 1);

      expect(manyUsersFirstPage.data.length).toBe(1);

      const janeResponse = manyUsersSecondPage.data.find(item => item.account_name === userJane.account_name);
      expect(_.isEmpty(janeResponse)).toBeFalsy();

      expect(manyUsersSecondPage.metadata.total_amount).toBe(2);
      expect(manyUsersSecondPage.metadata.has_more).toBeFalsy();
      expect(manyUsersSecondPage.metadata.page).toBe(2);
      expect(manyUsersSecondPage.metadata.per_page).toBe(1);
    }, JEST_TIMEOUT);

    it('Smoke - Check ordering', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const manyUsersVladIsFirst =
        await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId, 'score');

      expect(manyUsersVladIsFirst.data[0].account_name).toBe(userJane.account_name);
      expect(manyUsersVladIsFirst.data[1].account_name).toBe(userVlad.account_name);

      const manyUsersJaneIsFirst =
        await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId, 'external_login');

      expect(manyUsersJaneIsFirst.data[0].account_name).toBe(userJane.account_name);
      expect(manyUsersJaneIsFirst.data[1].account_name).toBe(userVlad.account_name);

      const manyUsersOrderById =
        await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId, '-id');

      expect(manyUsersOrderById.data[0].account_name).toBe(userJane.account_name);
      expect(manyUsersOrderById.data[1].account_name).toBe(userVlad.account_name);
    }, JEST_TIMEOUT);
  });

  describe('Github airdrop creation', () => {
    it('create valid airdrop with related accounts', async () => {
      const {
        airdropId, postId, startedAt, finishedAt, expectedTokens,
      } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const postOffer = await GraphqlHelper.getOnePostOfferWithoutUser(postId, airdropId);

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
    it('get only post offer itself with users_team data', async () => {
      const { postId, airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const postOfferWithEmptyTeam = await GraphqlHelper.getOnePostOfferWithoutUser(
        airdropId,
        postId,
      );

      for (const token of postOfferWithEmptyTeam.offer_data.tokens) {
        expect(token.amount_claim).toBe(token.amount_left);
      }

      expect(postOfferWithEmptyTeam.users_team.data.length).toBe(0);

      const userVladState = await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      const userJaneState = await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const postOfferWithTeam = await GraphqlHelper.getOnePostOfferWithoutUser(
        airdropId,
        postId,
      );

      expect(postOfferWithTeam.users_team.data.length).toBe(2);

      const claimedAmounts = {
        UOSTEST: 0,
        GHTEST: 0,
      };

      for (const token of userVladState.tokens) {
        claimedAmounts[token.symbol] += token.amount_claim;
      }

      for (const token of userJaneState.tokens) {
        claimedAmounts[token.symbol] += token.amount_claim;
      }

      for (const token of postOfferWithTeam.offer_data.tokens) {
        expect(token.amount_claim).not.toBe(token.amount_left);
        const claimed = claimedAmounts[token.symbol];

        expect(token.amount_left).toBe(token.amount_claim - claimed);
      }
    });

    it('get both post offer data and airdrop state with users_team data', async () => {
      const { postId, airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);
      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);

      const headers = RequestHelper.getGithubAuthHeader(githubToken);
      const postOfferWithEmptyTeam = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        headers,
      );

      expect(postOfferWithEmptyTeam.data.one_post_offer.users_team.data.length).toBe(0);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const postOfferWithTeam = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        headers,
      );

      expect(postOfferWithTeam.data.one_post_offer.users_team.data.length).toBe(2);
    }, JEST_TIMEOUT_DEBUG);

    it('get both post offer data and airdrop state via github token', async () => {
      const { postId, airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);

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

      expect(response).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(airdropId, usersExternalId, conditions, userVlad.id),
      );
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
      await AirdropsUsersToPendingService.process(airdropId);

      const userAirdropWithAllTrue = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      const conditionsAllTrue = {
        auth_github: true,
        auth_myself: true,
        following_devExchange: true,
      };

      expect(userAirdropWithAllTrue).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(
          airdropId,
          usersExternalId,
          conditionsAllTrue,
          userVlad.id,
          AirdropStatuses.PENDING,
        ),
      );

      // Lets UNfollow required community and expect following condition = true
      await OrganizationsHelper.requestToUnfollowOrganization(orgId, userVlad);
      const userAirdropWithUnfollowedOrg = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

      expect(userAirdropWithUnfollowedOrg).toMatchObject(
        AirdropsUsersGenerator.getExpectedUserAirdrop(
          airdropId,
          usersExternalId,
          conditionsAllAuthAndPairing,
          userVlad.id,
          AirdropStatuses.PENDING, // after processing it is not possible to change status to new
        ),
      );
    }, JEST_TIMEOUT_DEBUG);

    it('get user state via github token', async () => {
      const { airdropId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      const sampleToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
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

      const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);
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
