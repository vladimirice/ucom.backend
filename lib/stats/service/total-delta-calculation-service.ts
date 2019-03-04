/* eslint-disable no-console */
/* tslint:disable:max-line-length */
import { EventDbDataDto } from '../interfaces/dto-interfaces';


import TotalsJobParams = require('../job-params/totals-job-params');
import StatsFetchCalculation = require('./fetch/stats-fetch-calculation');
import StatsTotalEventsCreator = require('./creator/stats-total-events-creator');
import moment = require('moment');

class TotalDeltaCalculationService {
  public static async updateTotalDeltas() {
    const entitiesSets = [
      TotalsJobParams.getDeltaSet(),
    ];

    for (const set of entitiesSets) {
      for (const params of set) {
        await this.processOneToOne(params);
      }
    }
  }

  private static async processOneToOne(params: any): Promise<void> {
    const [lastData, lastOfGivenDateData]: [EventDbDataDto[], EventDbDataDto[]] =
      await StatsFetchCalculation.findStatsData(params);

    const lastValue: number   = this.prepareDeltaDataToProcess(lastData, params.isFloat);
    const resultValue: number = this.calculateDeltaValue(lastValue, lastOfGivenDateData, params.isFloat);

    const createdAt = moment().utc().format();

    await StatsTotalEventsCreator.createTotalEvent(params, resultValue, createdAt);
    await StatsTotalEventsCreator.upsertCurrentTotalParams(params, resultValue, createdAt);
  }

  private static prepareDeltaDataToProcess(
    lastData: EventDbDataDto[],
    isFloat: boolean,
  ): any {
    if (lastData.length !== 1) {
      throw new Error('LastData array is malformed. Length should be equal to 1');
    }

    const current = lastData[0];

    let lastValue = current.result_value;
    if (isFloat) {
      lastValue = +lastValue.toFixed(10);
    }

    return lastValue;
  }

  private static calculateDeltaValue(
    lastValue: number,
    lastOfGivenDateData: EventDbDataDto[],
    isFloat: boolean,
  ): number {
    if (lastOfGivenDateData.length !== 1) {
      throw new Error('LastData array is malformed. Length should be equal to 1');
    }

    const current = lastOfGivenDateData[0];

    const firstValue = isFloat ? +current.result_value.toFixed(10) : current.result_value;

    let deltaValue = lastValue - firstValue;
    if (isFloat) {
      deltaValue = +deltaValue.toFixed(10);
    }

    return deltaValue;
  }
}

export = TotalDeltaCalculationService;
