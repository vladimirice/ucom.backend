/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionVoteForCalculators,
} from '../../interfaces/blockchain-actions-interfaces';

import AbstractTracesProcessor = require('../abstract-traces-processor');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

class VoteForCalculatorsTraceProcessor extends AbstractTracesProcessor {
  readonly traceType: number = BlockchainTrTraces.getTypeVoteForCalculatorNodes();

  readonly expectedActionsData = {
    votecalc: {
      validationSchema: {
        voter:        joi.string().required().min(1).max(12),
        calculators:  joi.array().items(joi.string()),
      },
      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionVoteForCalculators>actNameToActionDataArray.votecalc[0];

    return {
      from: actionData.act_data.voter,
      memo: '',
      to: null,
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const actionData = <ITraceActionVoteForCalculators>actNameToActionDataArray.votecalc[0];

    return {
      calculators: actionData.act_data.calculators,
    };
  }
}

export = VoteForCalculatorsTraceProcessor;
