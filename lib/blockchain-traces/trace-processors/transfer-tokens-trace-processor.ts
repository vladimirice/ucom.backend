/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';
import { ITraceChainMetadata, TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';
import { ITraceTransferTokensData } from '../interfaces/blockchain-actions-interfaces';

import CommonTracesProcessor = require('./common-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class TransferTokensTraceProcessor implements TraceProcessor {
  private readonly traceType        = BlockchainTrTraces.getTypeTransfer();

  private readonly expectedActName  = 'transfer';

  private readonly expectedActionsLength  = 1;

  private readonly actionDataSchema = {
    from:               joi.string().required().min(1).max(12),
    to:                 joi.string().required().min(1).max(12),
    memo:               joi.string().empty(''),
    quantity:           joi.string().required().min(1),
  };


  processTrace(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace | null {
    // TODO - implement a factory method pattern
    if (metadata.isError) {
      return null;
    }

    if (trace.actions.length !== this.expectedActionsLength) {
      return null;
    }

    const { act } = trace.actions[0];
    if (act.name !== this.expectedActName) {
      return null;
    }

    const actionData: ITraceTransferTokensData = <ITraceTransferTokensData>trace.actions[0].act_data;
    const { error } = joi.validate(actionData, this.actionDataSchema, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      return null;
    }

    const processedTrace = {}; // TODO - prepare as for old data

    return CommonTracesProcessor.getTraceToInsertToDb(
      this.traceType,
      processedTrace,
      trace,
      actionData.from,
      actionData.to,
      actionData.memo,
    );
  }
}

export = TransferTokensTraceProcessor;
