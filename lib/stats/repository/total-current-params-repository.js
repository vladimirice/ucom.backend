"use strict";
const knex = require("../../../config/knex");
const TABLE_NAME = 'total_current_params';
class TotalCurrentParamsRepository {
    static async findAllAndFlattenJsonValue() {
        const data = await knex(TABLE_NAME).select('json_value');
        const res = {};
        data.forEach((item) => {
            res[item.json_value.event_type] = item.json_value;
        });
        return res;
    }
    static async findOneByEventType(eventType) {
        return knex(TABLE_NAME).where({
            event_type: eventType,
        }).first();
    }
    static async updateCurrentParamsByEventType(eventType, jsonValue, resultValue) {
        const jsonString = JSON.stringify(jsonValue);
        const sql = `
      INSERT INTO total_current_params
        (event_type, json_value, result_value) VALUES (${eventType}, '${jsonString}', ${resultValue}) 
        ON CONFLICT (event_type)
        DO UPDATE SET 
          json_value    = '${jsonString}',
          result_value  = ${resultValue},
          updated_at    = NOW();
    `;
        await knex.raw(sql);
    }
}
module.exports = TotalCurrentParamsRepository;
