import { JsonValue } from '../interfaces/model-interfaces';

const DEFAULT_WORKER_RECALC_PERIOD = '1h';

class JsonValueService {
  public static getJsonValueParameter(
    fieldName: string,
    data: any,
    workerRecalcPeriod: string = DEFAULT_WORKER_RECALC_PERIOD,
  ): JsonValue {
    return {
      worker_recalc_period: workerRecalcPeriod,
      description: `fetch and save current value of ${fieldName}`,
      data,
    };
  }
}

export = JsonValueService;
