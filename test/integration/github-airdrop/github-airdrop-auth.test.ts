import delay from 'delay';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');

import GithubRequest = require('../../helpers/github-request');
import UsersExternalRepository = require('../../../lib/users-external/repository/users-external-repository');
import GithubSampleValues = require('../../helpers/github-sample-values');
import _ = require('lodash');
import UsersExternalAuthLogRepository = require('../../../lib/users-external/repository/users-external-auth-log-repository');
import PostsGenerator = require('../../generators/posts-generator');
import AuthService = require('../../../lib/auth/authService');
import UsersExternalRequest = require('../../helpers/users-external-request');
import AirdropCreatorService = require('../../../lib/airdrops/service/airdrop-creator-service');
import OrganizationsGenerator = require('../../generators/organizations-generator');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 10000;


function getExpectedUserAirdrop() {
  return {
    airdrop_id: 1,
    user_id: null, // null only if airdrop_status = new
    github_score: 550.044,
    airdrop_status: 1, // new
    conditions: {
      auth_github: true,
      auth_myself: false,
      following_devExchange: false,
    },
    tokens: [
      {
        amount_claim: 50025,
        symbol: 'UOS',
      },
      {
        amount_claim: 82678,
        symbol: 'FN',
      },
    ],
  };
}

async function createNewAirdrop() {
  const postsIds = await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, 100);

  const postId = postsIds[postsIds.length - 1];

  const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

  const tokens = [
    {
      symbol_id: 2,
      amount: 300000,
    },
    {
      symbol_id: 3,
      amount: 100000,
    },
  ];

  const title = 'github_airdrop';
  const conditions = {
    auth_github: true,
    auth_myself: true,
    community_id_to_follow: orgId,
  };

  const startedAt = '2019-04-01T14:51:35Z';
  const finishedAt = '2019-05-30T14:51:35Z';

  // eslint-disable-next-line no-shadow
  const {airdropId} = await AirdropCreatorService.createNewAirdrop(
    title,
    postId,
    conditions,
    startedAt,
    finishedAt,
    tokens,
  );

  return {
    airdropId,
    postId,
    startedAt,
    finishedAt,
  };
}

describe('Github airdrop auth', () => {
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
      const expectedTokens = [
        {
          symbol: 'UOSTEST',
          amount_claim: 30,
          amount_left: 25,
        },
        {
          symbol: 'UOSGHAIRTEST',
          amount_claim: 10,
          amount_left: 5,
        },
      ];

      const {
        airdropId, postId, startedAt, finishedAt,
      } = await createNewAirdrop();

      const postOffer = await GraphqlHelper.getOnePostOfferWithoutUser(postId);

      expect(postOffer.offer_data).toBeDefined();
      expect(postOffer.offer_data.airdrop_id).toBe(airdropId);
      expect(postOffer.offer_data.tokens).toMatchObject(expectedTokens);

      expect(postOffer.started_at).toBe(startedAt);
      expect(postOffer.finished_at).toBe(finishedAt);
    }, JEST_TIMEOUT * 100);
  });

  describe('Positive', () => {
    it('Github callback endpoint', async () => {
      await GithubRequest.sendSampleGithubCallback();
      const vladSampleData = GithubSampleValues.getVladSampleExternalData();

      const data = await UsersExternalRepository.findExternalUserByExternalId(vladSampleData.id);

      expect(_.isEmpty(data)).toBeFalsy();

      expect(data!.external_login).toBe(vladSampleData.login);
      expect(data!.json_value).toEqual(vladSampleData);
      expect(data!.user_id).toBeNull();

      const logData = await UsersExternalAuthLogRepository.findManyByUsersExternalId(+data!.id);
      expect(Array.isArray(logData)).toBeTruthy();
      expect(logData.length).toBe(1);

      expect(logData[0].json_value).toEqual(vladSampleData);

      await delay(1000);
      // check upsert - should be updating of existing data
      await GithubRequest.sendSampleGithubCallback();

      const logDataAfter = await UsersExternalAuthLogRepository.findManyByUsersExternalId(+data!.id);
      expect(Array.isArray(logDataAfter)).toBeTruthy();
      expect(logDataAfter.length).toBe(2);
    }, JEST_TIMEOUT);

    it('should receive secure cookie with valid token', async () => {
      const res = await GithubRequest.sendSampleGithubCallback();

      expect(Array.isArray(res.headers['set-cookie'])).toBeTruthy();
      expect(res.headers['set-cookie'].length).toBe(1);

      const githubTokenCookie = res.headers['set-cookie'][0].split(';')[0].split('=');

      expect(githubTokenCookie[0]).toBe(CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB);

      AuthService.extractUsersExternalIdByTokenOrError(githubTokenCookie[1]);
    }, JEST_TIMEOUT);

    it('get user state via github token', async () => {
      const sampleToken = AuthService.getNewGithubAuthToken(1, 20);

      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(1, sampleToken);

      expect(oneUserAirdrop).toMatchObject(getExpectedUserAirdrop());
    });

    it('get user state via auth token', async () => {
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdropViaAuthToken(userVlad, 1);

      expect(oneUserAirdrop).toMatchObject(getExpectedUserAirdrop());
    });

    it('get both post offer data and airdrop state', async () => {
      const {postId, airdropId} = await createNewAirdrop();

      const sampleToken = AuthService.getNewGithubAuthToken(1, 20);

      const res = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postId,
        sampleToken,
      );

      expect(res.data.one_post_offer).toBeDefined();
      expect(res.data.one_user_airdrop).toBeDefined();

      expect(res.data.one_user_airdrop).toMatchObject(getExpectedUserAirdrop());
    });
  });

  describe('Pair external user and registered user', () => {
    describe('Positive', () => {
      it('API to link github account and currently authorised user', async () => {
        const token = await GithubRequest.sendSampleGithubCallbackAndGetToken();

        await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, token);

        const usersExternalId = AuthService.extractUsersExternalIdByTokenOrError(token);

        const externalUser = await UsersExternalRepository.findExternalUserByPkId(usersExternalId);

        expect(externalUser!.user_id).toBe(userVlad.id);

        await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, token, 208);
      });
    });

    describe('Negative', () => {
      it('Error if no github token', async () => {
        const res = await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, null, 401);
        expect(res.body.errors).toBe('Please provide valid Github auth token');
      });

      it('Error if no Auth token', async () => {
        const sampleToken = AuthService.getNewGithubAuthToken(1, 20);

        const res = await UsersExternalRequest.sendPairExternalUserWithUser(null, sampleToken, 401);
        expect(res.body.errors).toBe('There is no Authorization Bearer token');
      });
    });
  });
});

export {};
