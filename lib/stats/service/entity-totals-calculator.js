"use strict";
const entity_event_repository_1 = require("../repository/entity-event-repository");
const TotalsJobParams = require("../job-params/totals-job-params");
const CommonModelProvider = require("../../common/service/common-model-provider");
const TotalCurrentParamsRepository = require("../repository/total-current-params-repository");
const moment = require("moment");
class EntityTotalsCalculator {
    static async calculate() {
        const paramsSet = TotalsJobParams.getCurrentNumberSet();
        for (const params of paramsSet) {
            await this.calculateByParams(params);
        }
    }
    static async calculateByParams(params) {
        const resultValue = await params.providerFunc();
        const jsonValue = {
            description: params.description,
            recalc_interval: params.recalcInterval,
        };
        const createdAt = moment().utc().format();
        const event = {
            entity_id: CommonModelProvider.getFakeEntityId(),
            entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
            entity_name: CommonModelProvider.getEntityName(),
            event_type: params.eventType,
            event_group: params.eventGroup,
            event_super_group: params.eventSuperGroup,
            // @ts-ignore
            json_value: jsonValue,
            result_value: resultValue,
            created_at: createdAt,
        };
        await entity_event_repository_1.EntityEventRepository.insertOneEvent(event);
        const jsonValueForCurrent = {
            event_type: params.eventType,
            value: resultValue,
            recalc_interval: params.recalcInterval,
            description: params.description,
            created_at: createdAt,
        };
        await TotalCurrentParamsRepository.updateCurrentParamsByEventType(params.eventType, jsonValueForCurrent, resultValue);
    }
}
module.exports = EntityTotalsCalculator;
