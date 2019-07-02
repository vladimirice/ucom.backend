import { injectable } from 'inversify';
import { ValidationError } from 'joi';

import { TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';

import 'reflect-metadata';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceAction,
  ITraceActionData,
} from '../interfaces/blockchain-actions-interfaces';
import { StringToAnyCollection } from '../../common/interfaces/common-types';
import { MalformedProcessingError, UnableToProcessError } from './processor-errors';

import CommonTracesProcessor = require('./common-traces-processor');

const joi = require('joi');

@injectable()
abstract class AbstractTracesProcessor implements TraceProcessor {
  abstract readonly traceType: number;

  abstract readonly expectedActionsData: {
    [index: string]: {
      validationSchema: StringToAnyCollection,
      minNumberOfActions: number,
      maxNumberOfActions: number,
    }
  };

  abstract getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection;

  abstract getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo;

  public processTrace(trace: ITrace): IProcessedTrace {
    this.allActNamesAllowedOrError(trace);

    const validatedActionsData: IActNameToActionDataArray = {};

    for (const actName in this.expectedActionsData) {
      if (!this.expectedActionsData.hasOwnProperty(actName)) {
        continue;
      }

      const { validationSchema, minNumberOfActions, maxNumberOfActions } = this.expectedActionsData[actName];

      validatedActionsData[actName] = this.findActionsDataByRules(
        actName,
        validationSchema,
        minNumberOfActions,
        maxNumberOfActions,
        trace,
      );
    }

    const processedTrace = this.getTraceThumbnail(validatedActionsData);

    const { from, to, memo } = this.getFromToAndMemo(validatedActionsData);

    return CommonTracesProcessor.getTraceToInsertToDb(
      this.traceType,
      processedTrace,
      trace,
      from,
      to,
      memo,
    );
  }

  protected throwMalformedError(message: string): void {
    throw new MalformedProcessingError(`Trace type: ${this.traceType}. ${message}`);
  }

  private allActNamesAllowedOrError(trace: ITrace): void {
    const allowedActNames: string[] = Object.keys(this.expectedActionsData);

    const notAllowed: ITraceAction[] = trace.actions.filter(action => !allowedActNames.includes(action.act.name));

    if (notAllowed.length > 0) {
      throw new UnableToProcessError();
    }
  }

  private findActionsDataByRules(
    actName: string,
    validationSchema: StringToAnyCollection,
    minNumberOfActions: number,
    maxNumberOfActions: number,
    trace: ITrace,
  ): ITraceAction[] {
    const targetActions: ITraceAction[] = trace.actions.filter(action => action.act.name === actName);

    if (targetActions.length < minNumberOfActions || targetActions.length > maxNumberOfActions) {
      throw new UnableToProcessError();
    }

    for (const action of targetActions) {
      this.validateActionByActData(action, validationSchema);
    }

    return targetActions;
  }

  private validateActionByActData(
    action: ITraceAction,
    validationSchema: StringToAnyCollection,
  ): ITraceAction {
    const actData: ITraceActionData = action.act_data;

    const { error }: { error: ValidationError } = joi.validate(actData, validationSchema, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      this.throwMalformedError('Action name is ok but there are validation errors');
    }

    return action;
  }
}

export = AbstractTracesProcessor;
