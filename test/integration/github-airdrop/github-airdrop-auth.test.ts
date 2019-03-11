import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
// @ts-ignore
import GithubRequest = require('../../helpers/github-request');

// @ts-ignore
let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

// #task - these are is unit tests
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
    it('Github callback endpoint', async () => {
      const code = '369a07fbd5b93336b641';

      // How to autotest? Response by sample data

      await GithubRequest.sendSampleGithubCallback(code);


      // TODO - endpoint to receive github callback
      /*
      Step 1:
        * then exchange code to token. Use mockup github url from config. Mockup endpoint
        * then fetch data from github. Same mockup endpoint
        * Save all data to db - external_auth + external_auth_log
        * redirect user to required URL
      */
    }, 10000);
  });
});

export {};
