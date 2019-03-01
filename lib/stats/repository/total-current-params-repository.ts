import { TotalCurrentParamsModel } from '../interfaces/dto-interfaces';

import knex = require('../../../config/knex');

const TABLE_NAME = 'total_current_params';

class TotalCurrentParamsRepository {
  public static async findOneByEventType(
    eventType: number,
  ): Promise<TotalCurrentParamsModel> {
    return knex(TABLE_NAME).where({
      event_type: eventType,
    }).first();
  }

  public static async updateCurrentParamsByEventType(
    eventType: number,
    jsonValue: any,
    resultValue: number,
  ): Promise<void> {
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

export = TotalCurrentParamsRepository;
