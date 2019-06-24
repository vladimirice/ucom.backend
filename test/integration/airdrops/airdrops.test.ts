import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import GithubRequest = require('../../helpers/github-request');
import PostsHelper = require('../helpers/posts-helper');
import CommonHelper = require('../helpers/common-helper');
import PostsOfferChecker = require('../../helpers/posts-offer-checker');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import _ = require('lodash');
import ResponseHelper = require('../helpers/response-helper');
import AirdropsTestSet = require('../../helpers/airdrops/airdrops-test-set');
import PostsGenerator = require('../../generators/posts-generator');
import UsersHelper = require('../helpers/users-helper');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;

// @ts-ignore
const JEST_TIMEOUT_DEBUG = 1000 * 1000;

describe('Airdrops create-get', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
    await AirdropsUsersGenerator.generateForVladAndJane();
    await AirdropsUsersGenerator.generateForVladAndJaneRoundTwo();
  });

  describe('Github airdrop participants', () => {
    it('Get many participants as separate request - first round', async () => {
      const airdropCreationResponse = await AirdropsGenerator.createNewAirdrop(userVlad);
      await AirdropsTestSet.getManyParticipantsAsSeparateRequest(userVlad, userJane, airdropCreationResponse);

      await PostsGenerator.createMediaPostByUserHimself(userVlad);
    }, JEST_TIMEOUT);

    it('Get many participants as separate request - second round', async () => {
      const airdropCreationResponse = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);
      await AirdropsTestSet.getManyParticipantsAsSeparateRequest(userVlad, userJane, airdropCreationResponse);
    }, JEST_TIMEOUT);

    it('Smoke - Check pagination', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

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

      const options = {
        airdrops: true,
        ...UsersHelper.propsAndCurrentParamsOptions(false),
      };

      CommonHelper.checkUsersListResponse(manyUsersFirstPage, options);
    }, JEST_TIMEOUT);

    it('Smoke - Check ordering', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

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
      } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

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
      const { postId, airdropId, orgId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

      const postOfferWithEmptyTeam = await GraphqlHelper.getOnePostOfferWithoutUser(
        postId,
        airdropId,
      );

      for (const token of postOfferWithEmptyTeam.offer_data.tokens) {
        expect(token.amount_claim).toBe(token.amount_left);
      }

      expect(postOfferWithEmptyTeam.users_team.data.length).toBe(0);

      const userVladState = await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
      const userJaneState = await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
      await AirdropsUsersToPendingService.process(airdropId);

      const postOfferWithTeam = await GraphqlHelper.getOnePostOfferWithoutUser(
        postId,
        airdropId,
      );

      expect(postOfferWithTeam.users_team.data.length).toBe(2);

      const options = {
        airdrops: true,
        ...UsersHelper.propsAndCurrentParamsOptions(false),
      };

      CommonHelper.checkUsersListResponse(postOfferWithTeam.users_team, options);

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

      // #task - move to the post_offer checker
      ResponseHelper.expectNotEmpty(postOfferWithTeam.offer_data.conditions);
    }, JEST_TIMEOUT_DEBUG);

    it('get both post offer data and airdrop state with users_team data', async () => {
      const { postId, airdropId, orgId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);
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
      const { postId, airdropId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

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
      const { postId, airdropId } = await AirdropsGenerator.createNewGithubRoundTwoAirdropWithTheSecond(userVlad);

      const headers: any = RequestHelper.getAuthBearerHeader(<string>userVlad.token);
      const res = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        headers,
      );

      const options = CommonHelper.getOptionsForListAndGuest();
      PostsOfferChecker.checkGithubAirdropOfferStructure(res.data.one_post_offer, options);

      AirdropsUsersChecker.checkAirdropsStructure(res.data.one_user_airdrop);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
