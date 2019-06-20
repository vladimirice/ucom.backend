/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';
import { ITraceChainMetadata, TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';

import CommonTracesProcessor = require('./common-traces-processor');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class UnknownTraceProcessor implements TraceProcessor {
  processTrace(
    trace: ITrace,
    // @ts-ignore - not required for unknown processing
    metadata: ITraceChainMetadata,
  ): IProcessedTrace {
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
