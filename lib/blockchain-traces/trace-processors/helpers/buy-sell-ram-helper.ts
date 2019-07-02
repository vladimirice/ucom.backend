import { UOS } from '../../../common/dictionary/symbols-dictionary';
import {
  ITraceAction,
} from '../../interfaces/blockchain-actions-interfaces';
import { MalformedProcessingError } from '../processor-errors';

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import TransferUosHelper = require('./transfer-uos-helper');

class BuySellRamHelper {
  public static getRamPriceAndFee(actionData: ITraceAction, traceType: number): { ramPrice: number, ramFee: number } {
    const response = {
      ramPrice: 0,
      ramFee:   0,
    };

    const inlineTraces = <ITraceAction[]>actionData.inline_traces;

    if (inlineTraces.length !== 2) {
      throw new MalformedProcessingError('inlineTraces.length !== 2');
    }

    response.ramPrice = this.getRamPrice(inlineTraces, traceType);
    response.ramFee = this.getRamFee(inlineTraces);

    return response;
  }

  public static getThumbnail(bytes: number, tokensAmount: number) {
    return {
      resources: {
        ram: {
          dimension: 'kB',
          amount:  +(bytes / 1024).toFixed(4),
          tokens: {
            amount: +(tokensAmount).toFixed(4),
            currency: UOS,
          },
        },
      },
    };
  }

  private static getRamPrice(inlineTraces: ITraceAction[], traceType: number) {
    const traceTypeToMemo = {
      [BlockchainTrTraces.getTypeBuyRamBytes()]:  'buy ram',
      [BlockchainTrTraces.getTypeSellRam()]:      'sell ram',
    };

    const memo: string = traceTypeToMemo[traceType];
    if (!memo) {
      throw new TypeError(`Unsupported trace type: ${traceType}`);
    }

    const trace = inlineTraces.find(item => item.act.name === 'transfer' && item.act_data.memo === memo);
    if (!trace) {
      throw new MalformedProcessingError('There is no ramPriceTrace');
    }

    TransferUosHelper.validateTraceActDataOrMalformed(trace);

    return BalancesHelper.getTokensAmountFromString(trace!.act_data.quantity, UOS);
  }

  private static getRamFee(inlineTraces: ITraceAction[]): number {
    const trace = inlineTraces.find(item => item.act.name === 'transfer' && item.act_data.to === 'eosio.ramfee');
    if (!trace) {
      throw new MalformedProcessingError('There is no ramFeeTrace');
    }

    TransferUosHelper.validateTraceActDataOrMalformed(trace);

    return BalancesHelper.getTokensAmountFromString(trace!.act_data.quantity, UOS);
  }
}

export = BuySellRamHelper;
