import delay from 'delay';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import GithubRequest = require('../../helpers/github-request');
import UsersExternalRepository = require('../../../lib/users-external/repository/users-external-repository');
import GithubSampleValues = require('../../helpers/github-sample-values');
import _ = require('lodash');
import UsersExternalAuthLogRepository = require('../../../lib/users-external/repository/users-external-auth-log-repository');
import AuthService = require('../../../lib/auth/authService');
import UsersExternalRequest = require('../../helpers/users-external-request');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

let userVlad: UserModel;
let userJane: UserModel;

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
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Sample point in order to simplify manual testing', async () => {
      const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
      await AirdropsUsersGenerator.fulfillAirdropCondition(
        airdropId,
        userJane,
        orgId,
        true,
        <string>userVlad.github_code,
        true,
      );

      const userVladExternal = await UsersExternalRepository.findGithubUserExternalByUserId(userVlad.id);
      const userJaneExternal = await UsersExternalRepository.findGithubUserExternalByUserId(userJane.id);

      expect(userVladExternal!.external_login).toBe(userJaneExternal!.external_login);
      expect(userVladExternal!.json_value.id).toBe(userJaneExternal!.json_value.id);
      expect(userVladExternal!.external_id).not.toBe(userJaneExternal!.external_id);
    }, JEST_TIMEOUT * 100);

    it('Github callback endpoint', async () => {
      await GithubRequest.sendSampleGithubCallback(<string>userVlad.github_code);
      const vladSampleData = GithubSampleValues.getVladSampleExternalData();

      const data = await UsersExternalRepository.findGithubUserExternalExternalId(vladSampleData.id);

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
      await GithubRequest.sendSampleGithubCallback(<string>userVlad.github_code);

      const logDataAfter = await UsersExternalAuthLogRepository.findManyByUsersExternalId(+data!.id);
      expect(Array.isArray(logDataAfter)).toBeTruthy();
      expect(logDataAfter.length).toBe(2);
    }, JEST_TIMEOUT);

    it('should receive secure cookie with valid token', async () => {
      const res = await GithubRequest.sendSampleGithubCallback(<string>userVlad.github_code);

      expect(Array.isArray(res.headers['set-cookie'])).toBeTruthy();
      expect(res.headers['set-cookie'].length).toBe(1);

      const githubTokenCookie = res.headers['set-cookie'][0].split(';')[0].split('=');

      expect(githubTokenCookie[0]).toBe(CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB);

      AuthService.extractUsersExternalIdByTokenOrError(githubTokenCookie[1]);
    }, JEST_TIMEOUT);
  });

  describe('Pair external user and registered user', () => {
    describe('Positive', () => {
      it('API to link github account and currently authorised user', async () => {
        const token = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>userVlad.github_code);

        await UsersExternalRequest.sendPairExternalUserWithUser(userVlad, token);

        const usersExternalId = AuthService.extractUsersExternalIdByTokenOrError(token);

        const externalUser = await UsersExternalRepository.findGithubUserExternalByPkId(usersExternalId);

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
