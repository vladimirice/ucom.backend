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
      const code = 'e563547ef8a972f2ebeb';

      await GithubRequest.sendSampleGithubCallback(code);

      // const sampleResponse = '{"access_token":"cb259e0f9ea2b0dc02323e80d3b6667e8ce6462e","token_type":"bearer","scope":""}';
      // const decoded = JSON.parse(resp);

      // TODO - endpoint to receive github callback
      /*
      Step 1:
        * log incoming request, catch redirect url - saving and redirect mockup for autotests
        * then exchange code to token. Use mockup github url from config. Mockup endpoint
        * then fetch data from github. Same mockup endpoint
        * Save all data to db - external_auth + external_auth_log
        * redirect user to required URL
      */
    }, 10000);
  });
});

export {};
