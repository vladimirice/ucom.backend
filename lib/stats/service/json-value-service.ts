import { JsonValue } from '../interfaces/model-interfaces';

const DEFAULT_WORKER_RECALC_PERIOD = '1h';

class JsonValueService {
  public static getJsonValueParameter(
    description: string,
    data: any,
    workerRecalcPeriod: string = DEFAULT_WORKER_RECALC_PERIOD,
  ): JsonValue {
    return {
      description,
      data,
      worker_recalc_period: workerRecalcPeriod,
    };
  }
}

export = JsonValueService;
