"use strict";
const entity_event_repository_1 = require("../../repository/entity-event-repository");
const moment = require("moment");
class StatsFetchCalculation {
    static async findStatsData(params) {
        const newData = moment().subtract(params.windowIntervalHours, 'hours');
        const createdAtAsString = newData.utc().format('YYYY-MM-DD HH:mm:ss');
        // #optimization - LATERAL JOIN
        // see https://medium.com/kkempin/postgresqls-lateral-join-bfd6bd0199df
        return Promise.all([
            entity_event_repository_1.EntityEventRepository.findLastRowsGroupedByEntity(`event_type = ${params.initialEventType} AND entity_name = '${params.entityName}'`),
            entity_event_repository_1.EntityEventRepository.findLastRowsGroupedByEntity(`"event_type" = ${params.initialEventType} AND entity_name = '${params.entityName}' AND created_at < '${createdAtAsString}'`),
        ]);
    }
}
module.exports = StatsFetchCalculation;
