/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import { ITraceActionData } from '../../interfaces/blockchain-actions-interfaces';

import AbstractTracesProcessor = require('../abstract-traces-processor');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

class VoteForCalculatorsTraceProcessor extends AbstractTracesProcessor {
  readonly actionDataSchema: StringToAnyCollection = {
    voter:        joi.string().required().min(1).max(12),
    calculators:  joi.array().items(joi.string()),
  };

  readonly expectedActName: string        = 'votecalc';

  readonly expectedActionsLength: number  = 1;

  readonly serviceName: string            = 'vote-for-calculators';

  readonly traceType: number              = BlockchainTrTraces.getTypeVoteForCalculatorNodes();

  getFromToAndMemo(actionData: ITraceActionData): { from: string; to: string | null; memo: string } {
    return {
      from: actionData.voter,
      memo: '',
      to: null,
    };
  }

  getTraceThumbnail(actionData: ITraceActionData): StringToAnyCollection {
    return {
      calculators: actionData.calculators,
    };
  }
}

export = VoteForCalculatorsTraceProcessor;
