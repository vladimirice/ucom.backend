/* eslint-disable class-methods-use-this */

import { injectable } from 'inversify';
import { TraceProcessor } from '../../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';

import CommonTracesProcessor = require('./../common-traces-processor');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class UnknownTraceProcessor implements TraceProcessor {
  processTrace(trace: ITrace): IProcessedTrace {
    const traceType: number = BlockchainTrTraces.getTypeUnknown();

    return CommonTracesProcessor.getTraceToInsertToDb(
      traceType,
      {},
      trace,
      trace.account || 'unknown', // if malformed - possibly no account
    );
  }
}

export = UnknownTraceProcessor;
