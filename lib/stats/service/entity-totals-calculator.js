"use strict";
const TotalsJobParams = require("../job-params/totals-job-params");
const moment = require("moment");
const StatsTotalEventsCreator = require("./creator/stats-total-events-creator");
class EntityTotalsCalculator {
    static async calculate() {
        const paramsSet = TotalsJobParams.getCurrentNumberSet();
        for (const params of paramsSet) {
            await this.calculateByParams(params);
        }
    }
    static async calculateByParams(params) {
        const resultValue = await params.providerFunc();
        const createdAt = moment().utc().format();
        await StatsTotalEventsCreator.createTotalEvent(params, resultValue, createdAt);
        await StatsTotalEventsCreator.upsertCurrentTotalParams(params, resultValue, createdAt);
    }
}
module.exports = EntityTotalsCalculator;
