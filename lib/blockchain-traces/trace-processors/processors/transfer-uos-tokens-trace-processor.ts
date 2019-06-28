/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';

import 'reflect-metadata';
import { ITraceActionData, ITraceTransferTokensData } from '../../interfaces/blockchain-actions-interfaces';
import { UOS } from '../../../common/dictionary/symbols-dictionary';

import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import AbstractTracesProcessor = require('./../abstract-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class TransferUosTokensTraceProcessor extends AbstractTracesProcessor {
  readonly serviceName: string = 'transfer-uos-tokens';

  readonly traceType: number = BlockchainTrTraces.getTypeTransfer();

  readonly expectedActName: string  = 'transfer';

  readonly expectedActionsLength: number  = 1;

  readonly actionDataSchema = {
    from:               joi.string().required().min(1).max(12),
    to:                 joi.string().required().min(1).max(12),
    memo:               joi.string().empty(''),
    // eslint-disable-next-line security/detect-non-literal-regexp
    quantity:           joi.string().required().regex(new RegExp(UOS)),
  };

  getTraceThumbnail(actionData: ITraceTransferTokensData) {
    return {
      tokens: {
        active:   BalancesHelper.getTokensAmountFromString(actionData.quantity, UOS),
        currency: UOS,
      },
    };
  }

  getFromToAndMemo(actionData: ITraceActionData): { from: string; to: string | null; memo: string } {
    return {
      from: actionData.from,
      memo: actionData.memo,
      to: actionData.to,
    };
  }
}

export = TransferUosTokensTraceProcessor;
