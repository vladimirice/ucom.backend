/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionClaimEmission,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS } from '../../../common/dictionary/symbols-dictionary';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');

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

  readonly serviceName: string = 'vote-for-calculators';

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

    // TODO - more inline traces data inside the interface
    // TODO use joi schema and possibly move to the abstract class
    const inlineTraces = action.inline_traces;

    if (inlineTraces.length !== 2) {
      // this is an error
    }

    // fetch first inline trace no matter what

    const transferInlineTrace = inlineTraces.find(item => item.act.name === 'transfer')!;

    if (!transferInlineTrace) {
      // this is an error
    }

    if (!transferInlineTrace.act_data) {
      // this is an error
    }

    const { quantity } = transferInlineTrace.act_data;

    if (!quantity) { // must be string and contains UOS
      // this is an error
    }

    // act_data : {
    //   from : 'uos.calcs',
    //     to : actor.account_name,
    //     quantity : '1334.8073 UOS',
    //     memo : 'transfer issued tokens for account',
    // },

    return {
      tokens: {
        currency: UOS,
        emission: BalancesHelper.getTokensAmountFromString(quantity, UOS),
      },
    };
  }
}

export = ClaimEmissionTraceProcessor;
