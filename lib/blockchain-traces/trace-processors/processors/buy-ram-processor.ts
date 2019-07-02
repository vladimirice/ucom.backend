/* eslint-disable class-methods-use-this */
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionBuyRam,
} from '../../interfaces/blockchain-actions-interfaces';
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import { MalformedProcessingError } from '../processor-errors';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import BuySellRamHelper = require('../helpers/buy-sell-ram-helper');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

const actName = 'buyrambytes';

class BuyRamProcessor extends AbstractTracesProcessor {
  readonly expectedActionsData = {
    [actName]: {
      validationSchema: {
        payer:    joi.string().required().min(1).max(12),
        receiver: joi.string().required().min(1).max(12),
        bytes:    joi.number().required(),
      },
      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  readonly traceType: number = BlockchainTrTraces.getTypeBuyRamBytes();

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionBuyRam>actNameToActionDataArray[actName][0];

    return {
      from: actionData.act_data.payer,
      to: null,
      memo: '',
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const actionData = <ITraceActionBuyRam>actNameToActionDataArray[actName][0];

    let ramPrice: number = 0;
    let ramFee:   number = 0;

    try {
      ({ ramPrice, ramFee } = BuySellRamHelper.getRamPriceAndFee(actionData, this.traceType));
    } catch (error) {
      if (error instanceof MalformedProcessingError) {
        this.throwMalformedError(error.message);
      }

      throw error;
    }

    const { bytes } = actionData.act_data;
    const tokensAmount = ramPrice + ramFee;

    return BuySellRamHelper.getThumbnail(bytes, tokensAmount);
  }
}

export = BuyRamProcessor;
