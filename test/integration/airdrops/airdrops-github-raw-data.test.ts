import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import GithubRequest = require('../../helpers/github-request');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;

// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

let generatedForVlad;
// @ts-ignore
let generatedForJane;

describe('Airdrops users data from github raw data table', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();

    [generatedForVlad, generatedForJane] = await AirdropsUsersGenerator.generateForVladAndJane();
  });

  describe('Positive', () => {
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
    }, JEST_TIMEOUT);
  });
});

export {};
