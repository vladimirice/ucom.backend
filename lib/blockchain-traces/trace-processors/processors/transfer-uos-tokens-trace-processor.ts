/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';

import 'reflect-metadata';
import {
  IActNameToActionDataArray, IFromToMemo, ITraceActionTransferTokens,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS, UOS_REGEX } from '../../../common/dictionary/symbols-dictionary';

import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import AbstractTracesProcessor = require('./../abstract-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

// eslint-disable-next-line security/detect-non-literal-regexp


@injectable()
class TransferUosTokensTraceProcessor extends AbstractTracesProcessor {
  readonly serviceName: string = 'transfer-uos-tokens';

  readonly traceType: number = BlockchainTrTraces.getTypeTransfer();

  readonly expectedActionsData = {
    transfer: {
      validationSchema: {
        from:               joi.string().required().min(1).max(12),
        to:                 joi.string().required().min(1).max(12),
        memo:               joi.string().empty(''),
        quantity:           joi.string().required().regex(UOS_REGEX),
      },
      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray) {
    const actionData = <ITraceActionTransferTokens>actNameToActionDataArray.transfer[0];

    return {
      tokens: {
        active:   BalancesHelper.getTokensAmountFromString(actionData.act_data.quantity, UOS),
        currency: UOS,
      },
    };
  }

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionTransferTokens>actNameToActionDataArray.transfer[0];

    return {
      from: actionData.act_data.from,
      memo: actionData.act_data.memo,
      to: actionData.act_data.to,
    };
  }
}

export = TransferUosTokensTraceProcessor;
