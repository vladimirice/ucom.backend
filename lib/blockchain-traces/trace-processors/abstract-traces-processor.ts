import { injectable } from 'inversify';
import { ValidationError } from 'joi';

import { ITraceChainMetadata, TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';
import { ITraceActionData } from '../interfaces/blockchain-actions-interfaces';
import { StringToAnyCollection } from '../../common/interfaces/common-types';
import { WorkerLogger } from '../../../config/winston';

import CommonTracesProcessor = require('./common-traces-processor');

const joi = require('joi');

@injectable()
abstract class AbstractTracesProcessor implements TraceProcessor {
  abstract readonly serviceName: string;

  abstract readonly traceType: number;

  abstract readonly expectedActName: string;

  abstract readonly expectedActionsLength: number;

  abstract readonly actionDataSchema: StringToAnyCollection;

  abstract getTraceThumbnail(actionData: ITraceActionData, trace: ITrace): StringToAnyCollection;

  abstract getFromToAndMemo(actionData: ITraceActionData): {from: string, to: string | null, memo: string};

  public processTrace(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace | null {
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
    const { error }: {error: ValidationError} = joi.validate(actionData, this.actionDataSchema, {
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

    const processedTrace = this.getTraceThumbnail(actionData, trace);

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
}

export = AbstractTracesProcessor;
