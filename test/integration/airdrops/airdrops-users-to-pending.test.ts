import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
// @ts-ignore
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
// @ts-ignore
import RequestHelper = require('../helpers/request-helper');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;

describe('Airdrops users to pending', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  it('Process users one by one', async () => {
    // @ts-ignore
    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    await AirdropsUsersGenerator.fulfillAirdropCondition(userVlad, orgId, false);
    await AirdropsUsersGenerator.fulfillAirdropCondition(userJane, orgId, false);

    // const headers = RequestHelper.getAuthBearerHeader(<string>userVlad.token);

    // @ts-ignore
    // const userAirdropWithAllAuth = await GraphqlHelper.getOneUserAirdrop(airdropId, headers);

    // @ts-ignore
    // const a = 0;

    /* TODO
    * Create two users - upgrade `code` feature of autotests + add other user from github to imitate
    * Try to process - result is nothing
    * Prepare vlad to airdrop but not jane
    * Try to process - only vlad should be processed
    * Prepare jane also
    * Try to process - no error, jane is also prepared to airdrop
    * Try to process again, nothing new, no errors
    */
  }, JEST_TIMEOUT * 100);

  it('Process both users', async () => {
    /*
    * Create two users - upgrade `code` feature of autotests + add other user from github to imitate
    * Try to process - result is nothing
    * Prepare both vlad and jane to airdrop
    * Try to process - both of them should be processed
    * Try to process again - nothing new, no errors
    */
  }, JEST_TIMEOUT);
});

export {};
