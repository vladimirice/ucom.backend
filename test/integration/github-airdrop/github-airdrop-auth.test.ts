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

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 10000;

const airdropId = 1;

function getExpectedUserAirdrop() {
  return {
    airdrop_id: airdropId,
    user_id:  null, // null only if airdrop_status = new
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

  describe('Positive', () => {
    it('Get custom post-offer', async () => {
      // TODO - interface only
      const postsIds = await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, 100);

      // @ts-ignore
      const res = await GraphqlHelper.getGithubAirdropPostWithoutUser(postsIds[postsIds.length - 1]);
    }, JEST_TIMEOUT * 100);

    it('Github callback endpoint', async () => {
      await GithubRequest.sendSampleGithubCallback();
      const vladSampleData = GithubSampleValues.getVladSampleExternalData();

      const data = await UsersExternalRepository.findExternalUserByExternalId(vladSampleData.id);

      expect(_.isEmpty(data)).toBeFalsy();

      expect(data.external_login).toBe(vladSampleData.login);
      expect(data.json_value).toEqual(vladSampleData);
      expect(data.user_id).toBeNull();

      const logData = await UsersExternalAuthLogRepository.findManyByUsersExternalId(+data.id);
      expect(Array.isArray(logData)).toBeTruthy();
      expect(logData.length).toBe(1);

      expect(logData[0].json_value).toEqual(vladSampleData);

      await delay(1000);
      // check upsert - should be updating of existing data
      await GithubRequest.sendSampleGithubCallback();

      const logDataAfter = await UsersExternalAuthLogRepository.findManyByUsersExternalId(+data.id);
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

      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, sampleToken);

      expect(oneUserAirdrop).toMatchObject(getExpectedUserAirdrop());
    });

    it('get user state via auth token', async () => {
      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdropViaAuthToken(userVlad, airdropId);

      expect(oneUserAirdrop).toMatchObject(getExpectedUserAirdrop());
    });

    it('get both post offer data and airdrop state', async () => {
      const sampleToken = AuthService.getNewGithubAuthToken(1, 20);

      const postsIds = await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, 100);

      const res = await GraphqlHelper.getOnePostOfferWithUserAirdrop(
        airdropId,
        postsIds[postsIds.length - 1],
        sampleToken,
      );

      expect(res.data.one_post_offer).toBeDefined();
      expect(res.data.one_user_airdrop).toBeDefined();

      expect(res.data.one_user_airdrop).toMatchObject(getExpectedUserAirdrop());
    });

    it('API to link github account and currently authorised user', async () => {
      const sampleToken = AuthService.getNewGithubAuthToken(1, 20);

      await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, sampleToken);
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

export {};
