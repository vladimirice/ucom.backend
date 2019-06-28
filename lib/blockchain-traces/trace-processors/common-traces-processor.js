"use strict";
const moment = require("moment");
class CommonTracesProcessor {
    static getTraceToInsertToDb(traceType, processedTrace, trace, accountNameFrom, accountNameTo = null, memo = '') {
        return {
            tr_type: traceType,
            block_number: trace.blocknum,
            tr_id: trace.trxid,
            block_id: trace.blockid,
            tr_processed_data: processedTrace,
            account_name_from: accountNameFrom,
            account_name_to: accountNameTo,
            raw_tr_data: trace,
            tr_executed_at: moment(`${trace.blocktime}Z`).utc().format('YYYY-MM-DD HH:mm:ss'),
            memo,
        };
    }
}
module.exports = CommonTracesProcessor;
