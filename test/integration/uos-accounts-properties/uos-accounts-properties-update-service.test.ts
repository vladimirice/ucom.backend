/* eslint-disable no-loop-func */
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import UosAccountsPropertiesUpdateService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');
import UosAccountsPropertiesGenerator = require('../../generators/blockchain/importance/uos-accounts-properties-generator');
import UosAccountsPropertiesRepository = require('../../../lib/uos-accounts-properties/repository/uos-accounts-properties-repository');
import ResponseHelper = require('../helpers/response-helper');
import delay = require('delay');
import MockHelper = require('../helpers/mock-helper');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 5000;

let sampleData;
describe('Importance - get and update for accounts', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });

  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
    MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
    sampleData = UosAccountsPropertiesGenerator.getProcessedSampleData(userVlad, userJane, userPetr, userRokky);
  });

  describe('Positive', () => {
    it('update importance without pagination', async () => {
      const limit = 500;
      await UosAccountsPropertiesUpdateService.updateAll(limit);

      const manyActualDataFromCreation = await UosAccountsPropertiesRepository.findAll();
      expect(manyActualDataFromCreation.length).toBe(4);

      for (const sampleItem of sampleData) {
        if (sampleItem.name === 'notexistatall') {
          continue;
        }

        const actualFromCreation = manyActualDataFromCreation.find(item => item.account_name === sampleItem.name);

        ResponseHelper.expectNotEmpty(actualFromCreation);

        expect(actualFromCreation).toMatchObject(sampleItem.values);
      }
    }, JEST_TIMEOUT);

    it('update importance with pagination', async () => {
      const limit = 2;
      await UosAccountsPropertiesUpdateService.updateAll(limit);

      const manyActualDataFromCreation = await UosAccountsPropertiesRepository.findAll();
      expect(manyActualDataFromCreation.length).toBe(4);

      for (const sampleItem of sampleData) {
        if (sampleItem.name === 'notexistatall') {
          continue;
        }

        const actualFromCreation = manyActualDataFromCreation.find(item => item.account_name === sampleItem.name);

        ResponseHelper.expectNotEmpty(actualFromCreation);

        expect(actualFromCreation).toMatchObject(sampleItem.values);
      }

      await delay(1000);

      await UosAccountsPropertiesUpdateService.updateAll(limit);

      const manyActualDataFromUpdating = await UosAccountsPropertiesRepository.findAll();
      expect(manyActualDataFromUpdating.length).toBe(4);

      for (const oneActualDataFromUpdating of manyActualDataFromUpdating) {
        const matching = manyActualDataFromCreation.find(item => +item.id === +oneActualDataFromUpdating.id);
        ResponseHelper.expectNotEmpty(matching);

        expect(+oneActualDataFromUpdating.updated_at).toBeGreaterThan(+matching.updated_at);

        delete oneActualDataFromUpdating.updated_at;
        delete matching.updated_at;

        expect(oneActualDataFromUpdating).toMatchObject(matching);
      }
    }, JEST_TIMEOUT);
  });
});

export {};
