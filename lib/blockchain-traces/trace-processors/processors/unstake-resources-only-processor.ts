/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionUndelegateBw,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS } from '../../../common/dictionary/symbols-dictionary';
import { MalformedProcessingError } from '../processor-errors';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import StakeUnstakeHelper = require('../helpers/stake-unstake-helper');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

class UnstakeResourcesOnlyProcessor extends AbstractTracesProcessor {
  readonly expectedActionsData = {
    undelegatebw: {
      validationSchema: StakeUnstakeHelper.getUndelegateBwValidationSchema(),

      minNumberOfActions:   1, // CPU/NET only
      maxNumberOfActions:   2, // Both CPU and NET
    },
  };

  readonly traceType: number = BlockchainTrTraces.getTypeUnstakingRequest();

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionUndelegateBw>actNameToActionDataArray.undelegatebw[0];

    return {
      from: actionData.act_data.from,
      memo: '',
      to: null,
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const response = StakeUnstakeHelper.getEmptyThumbnail();

    const manyActions = <ITraceActionUndelegateBw[]>actNameToActionDataArray.undelegatebw;

    let cpuQuantity: number = 0;
    let netQuantity: number = 0;
    for (const action of manyActions) {
      const givenCpuQuantity: number =
        BalancesHelper.getTokensAmountFromString(action.act_data.unstake_cpu_quantity, UOS);
      const givenNetQuantity: number =
        BalancesHelper.getTokensAmountFromString(action.act_data.unstake_net_quantity, UOS);

      if (givenCpuQuantity !== 0) {
        if (cpuQuantity !== 0) {
          throw new MalformedProcessingError('There is more than one stake cpu action inside a trace');
        }

        cpuQuantity = givenCpuQuantity;
      }

      if (givenNetQuantity !== 0) {
        if (netQuantity !== 0) {
          throw new MalformedProcessingError('There is more than one stake net action inside a trace');
        }

        netQuantity = givenNetQuantity;
      }
    }

    if (cpuQuantity === 0 && netQuantity === 0) {
      throw new MalformedProcessingError('Both CPU and NET quantities are zero but at least one of them must be > 0');
    }

    response.resources.cpu.unstaking_request.amount = cpuQuantity;
    response.resources.net.unstaking_request.amount = netQuantity;

    return response;
  }
}

export = UnstakeResourcesOnlyProcessor;
