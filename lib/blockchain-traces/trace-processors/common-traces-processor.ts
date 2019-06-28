import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import moment = require('moment');

class CommonTracesProcessor {
  public static getTraceToInsertToDb(
    traceType: number,
    processedTrace: any,
    trace: ITrace,
    accountNameFrom: string,
    accountNameTo: string | null = null,
    memo: string = '',
  ): IProcessedTrace {
    return {
      tr_type:            traceType,

      block_number:       trace.blocknum,
      tr_id:              trace.trxid,
      block_id:           trace.blockid,

      tr_processed_data:  processedTrace,

      account_name_from:  accountNameFrom,
      account_name_to:    accountNameTo,

      raw_tr_data:        trace,
      tr_executed_at:     moment(`${trace.blocktime}Z`).utc().format('YYYY-MM-DD HH:mm:ss'),

      memo,
    };
  }
}

export = CommonTracesProcessor;
