import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import MockHelper = require('../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 5000;

describe('Importance - get and update for accounts', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('update importance', async () => {
      MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);

      await UosAccountsPropertiesUpdateService.updateAll();
    }, JEST_TIMEOUT);

    it('test with pagination', async () => {
      // TODO
    });
  });
});

export {};
