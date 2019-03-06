import { TotalStatsParams } from '../interfaces/dto-interfaces';

import TotalsJobParams = require('../job-params/totals-job-params');
import moment = require('moment');
import StatsTotalEventsCreator = require('./creator/stats-total-events-creator');

class EntityTotalsCalculator {
  public static async calculate(): Promise<void> {
    const paramsSet = TotalsJobParams.getCurrentNumberSet();

    for (const params of paramsSet) {
      await this.calculateByParams(params);
    }
  }

  private static async calculateByParams(params: TotalStatsParams) {
    const resultValue: number = await params.providerFunc();

    const createdAt = moment().utc().format();

    await StatsTotalEventsCreator.createTotalEvent(params, resultValue, createdAt);
    await StatsTotalEventsCreator.upsertCurrentTotalParams(params, resultValue, createdAt);
  }
}

export = EntityTotalsCalculator;
