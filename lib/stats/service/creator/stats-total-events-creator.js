"use strict";
const entity_event_repository_1 = require("../../repository/entity-event-repository");
const CommonModelProvider = require("../../../common/service/common-model-provider");
const TotalCurrentParamsRepository = require("../../repository/total-current-params-repository");
class StatsTotalEventsCreator {
    static async createTotalEvent(params, resultValue, createdAt) {
        const jsonValue = {
            description: params.description,
            recalc_interval: params.recalcInterval,
        };
        if (params.windowIntervalIso) {
            jsonValue.window_interval = params.windowIntervalIso;
        }
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
    }
    static async upsertCurrentTotalParams(params, resultValue, createdAt) {
        const jsonValueForCurrent = {
            event_type: params.eventType,
            value: resultValue,
            recalc_interval: params.recalcInterval,
            description: params.description,
            created_at: createdAt,
        };
        if (params.windowIntervalIso) {
            jsonValueForCurrent.window_interval = params.windowIntervalIso;
        }
        await TotalCurrentParamsRepository.updateCurrentParamsByEventType(params.eventType, jsonValueForCurrent, resultValue);
    }
}
module.exports = StatsTotalEventsCreator;
