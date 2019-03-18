import delay from 'delay';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
// @ts-ignore
import GithubRequest = require('../../helpers/github-request');
import UsersExternalRepository = require('../../../lib/users-external/repository/users-external-repository');
import GithubSampleValues = require('../../helpers/github-sample-values');
import _ = require('lodash');
import UsersExternalAuthLogRepository = require('../../../lib/users-external/repository/users-external-auth-log-repository');
import PostsGenerator = require('../../generators/posts-generator');

// @ts-ignore
let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 10000;

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
      const airdropId = 1;

      const expected = {
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

      const res = await GithubRequest.sendSampleGithubCallback();

      expect(Array.isArray(res.headers['set-cookie'])).toBeTruthy();
      expect(res.headers['set-cookie'].length).toBe(1);

      const tokenCookie = res.headers['set-cookie'][0].split(';')[0];

      const oneUserAirdrop = await GraphqlHelper.getOneUserAirdrop(airdropId, tokenCookie);

      expect(oneUserAirdrop).toMatchObject(expected);
    }, JEST_TIMEOUT);
  });
});

export {};
