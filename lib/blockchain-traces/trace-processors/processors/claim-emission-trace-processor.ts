/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionClaimEmission,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS } from '../../../common/dictionary/symbols-dictionary';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import TransferUosHelper = require('../helpers/transfer-uos-helper');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

class ClaimEmissionTraceProcessor extends AbstractTracesProcessor {
  readonly expectedActionsData = {
    withdrawal: {
      validationSchema: {
        owner: joi.string().required().min(1).max(12),
      },
      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  readonly traceType: number = BlockchainTrTraces.getTypeClaimEmission();

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionClaimEmission>actNameToActionDataArray.withdrawal[0];
    return {
      from: actionData.act_data.owner,
      memo: '',
      to: null,
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const action = <ITraceActionClaimEmission>actNameToActionDataArray.withdrawal[0];
    const inlineTraces = action.inline_traces;

    if (inlineTraces.length !== 2) {
      this.throwMalformedError('inlineTraces.length !== 2');
    }

    const issueTrace = inlineTraces.find(item => item.act.name === 'issue')!;
    if (!issueTrace) {
      this.throwMalformedError('There is no issue trace');
    }

    const transferInlineTrace = inlineTraces.find(item => item.act.name === 'transfer')!;

    if (!transferInlineTrace) {
      this.throwMalformedError('There is no transfer transaction');
    }

    return {
      tokens: {
        currency: UOS,
        emission: TransferUosHelper.getQuantity(transferInlineTrace),
      },
    };
  }
}

export = ClaimEmissionTraceProcessor;
