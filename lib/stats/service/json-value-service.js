"use strict";
const DEFAULT_WORKER_RECALC_PERIOD = '1h';
class JsonValueService {
    static getJsonValueParameter(description, data, workerRecalcPeriod = DEFAULT_WORKER_RECALC_PERIOD) {
        return {
            description,
            data,
            worker_recalc_period: workerRecalcPeriod,
        };
    }
}
module.exports = JsonValueService;
