"use strict";
const winston_1 = require("../../../config/winston");
const TotalsJobParams = require("../job-params/totals-job-params");
const StatsFetchCalculation = require("./fetch/stats-fetch-calculation");
const StatsTotalEventsCreator = require("./creator/stats-total-events-creator");
const moment = require("moment");
class TotalDeltaCalculationService {
    static async updateTotalDeltas() {
        const entitiesSets = [
            TotalsJobParams.getDeltaSet(),
        ];
        for (const set of entitiesSets) {
            for (const params of set) {
                try {
                    await this.processOneToOne(params);
                }
                catch (err) {
                    winston_1.WorkerLogger.error(err);
                    console.log('Lets skip and continue');
                }
            }
        }
    }
    static async processOneToOne(params) {
        const [lastData, lastOfGivenDateData] = await StatsFetchCalculation.findStatsData(params);
        const lastValue = this.prepareDeltaDataToProcess(lastData, params.isFloat);
        const resultValue = this.calculateDeltaValue(lastValue, lastOfGivenDateData, params.isFloat);
        const createdAt = moment().utc().format();
        await StatsTotalEventsCreator.createTotalEvent(params, resultValue, createdAt);
        await StatsTotalEventsCreator.upsertCurrentTotalParams(params, resultValue, createdAt);
    }
    static prepareDeltaDataToProcess(lastData, isFloat) {
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
    static calculateDeltaValue(lastValue, lastOfGivenDateData, isFloat) {
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
module.exports = TotalDeltaCalculationService;
