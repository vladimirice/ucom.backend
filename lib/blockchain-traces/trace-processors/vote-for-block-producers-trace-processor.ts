/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';
import { ITraceChainMetadata, TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';
import { ITraceActionData } from '../interfaces/blockchain-actions-interfaces';
import { WorkerLogger } from '../../../config/winston';

import CommonTracesProcessor = require('./common-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class VoteForBlockProducersTraceProcessor implements TraceProcessor {
  private readonly serviceName      = 'vote-for-block-producers';

  private readonly traceType        = BlockchainTrTraces.getTypeVoteForBp();

  private readonly expectedActName  = 'voteproducer';

  private readonly expectedActionsLength  = 1;

  private readonly actionDataSchema = {
    voter:      joi.string().required().min(1).max(12),
    proxy:      joi.string().empty(''),
    producers:  joi.array().items(joi.string()),
  };

  public processTrace(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace | null {
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

    const actionData: ITraceActionData = <ITraceActionData>trace.actions[0].act_data;
    const { error } = joi.validate(actionData, this.actionDataSchema, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      WorkerLogger.warn('Action name is ok but there are validation errors', {
        service: this.serviceName,
        error,
        trace,
      });

      metadata.isError = true;

      return null;
    }

    const processedTrace = this.getTraceThumbnail(actionData);

    const { from, to, memo } = this.getFromToAndMemo(actionData);

    return CommonTracesProcessor.getTraceToInsertToDb(
      this.traceType,
      processedTrace,
      trace,
      from,
      to,
      memo,
    );
  }

  private getFromToAndMemo(actionData: ITraceActionData): {from: string, to: string | null, memo: string} {
    return {
      from: actionData.voter,
      to: null,
      memo: '',
    };
  }

  private getTraceThumbnail(actionData: ITraceActionData) {
    return {
      producers: actionData.producers,
    };
  }
}

export = VoteForBlockProducersTraceProcessor;
