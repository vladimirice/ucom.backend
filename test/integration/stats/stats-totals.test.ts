/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import StatsHelper = require('../helpers/stats-helper');

import EntityTotalsCalculator = require('../../../lib/stats/service/entity-totals-calculator');

import EventParamTypeCommon = require('../../../lib/stats/dictionary/event-param/event-param-type-common-dictionary');
import StatsRequestHelper = require('../helpers/stats-request-helper');


const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

// @ts-ignore
let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;
// @ts-ignore
let userPetr: UserModel;
// @ts-ignore
let userRokky: UserModel;

describe('Stats totals', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Get stats', () => {
    it('Check stats url', async () => {
      // @ts-ignore
      const res = await StatsRequestHelper.getStatsTotal();

      // @ts-ignore
      const a = 0;
    });
  });

  describe('Stats for users', () => {
    it('Current number of users', async () => {
      const eventType = EventParamTypeCommon.USERS_PERSON__NUMBER;

      await EntityTotalsCalculator.calculate();

      const event: EntityEventParamDto =
        await EntityEventRepository.findOneEventOfTotals(eventType);

      const expected = {
        event_type: EventParamTypeCommon.USERS_PERSON__NUMBER,
        result_value: 4,
        json_value: {
          description:      'USERS_PERSON__NUMBER',
          recalc_interval:  'PT1H',
        },
      };

      const expectedCurrent = {
        event_type: EventParamTypeCommon.USERS_PERSON__NUMBER,
        value: 4,
        recalc_interval: 'PT1H',
        description: 'USERS_PERSON__NUMBER',
      };

      StatsHelper.checkOneEventOfTotals(event, expected);
      await StatsHelper.checkTotalsCurrentParams(eventType, expectedCurrent);

      // TODO - check that current params is correctly updated twice
    });
  });
});

export {};
