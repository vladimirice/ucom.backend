/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo, ITraceActionDelegateBw,
  ITraceActionUndelegateBw,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS } from '../../../common/dictionary/symbols-dictionary';
import { MalformedProcessingError } from '../processor-errors';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import StakeUnstakeHelper = require('../helpers/stake-unstake-helper');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

class StakeUnstakeResourcesProcessor extends AbstractTracesProcessor {
  readonly expectedActionsData = {
    delegatebw: {
      validationSchema: StakeUnstakeHelper.getDelegateBwValidationSchema(),

      minNumberOfActions:   1,
      maxNumberOfActions:   1,
    },
    undelegatebw: {
      validationSchema: StakeUnstakeHelper.getUndelegateBwValidationSchema(),

      minNumberOfActions:   1,
      maxNumberOfActions:   1,
    },
  };

  readonly traceType: number = BlockchainTrTraces.getTypeStakeWithUnstake();

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

    const unstakeAction = <ITraceActionUndelegateBw>actNameToActionDataArray.undelegatebw[0];

    const unstakeNetQuantity: number
      = BalancesHelper.getTokensAmountFromString(unstakeAction.act_data.unstake_net_quantity, UOS);
    const unstakeCpuQuantity: number
      = BalancesHelper.getTokensAmountFromString(unstakeAction.act_data.unstake_cpu_quantity, UOS);

    if (unstakeNetQuantity !== 0 && unstakeCpuQuantity !== 0) {
      throw new MalformedProcessingError('Both net and cpu is unstaked in one action. Expected that only one resource per action.');
    }

    response.resources.net.unstaking_request.amount = unstakeNetQuantity;
    response.resources.cpu.unstaking_request.amount = unstakeCpuQuantity;

    const stakeAction = <ITraceActionDelegateBw>actNameToActionDataArray.delegatebw[0];

    const stakeNetQuantity: number
      = BalancesHelper.getTokensAmountFromString(stakeAction.act_data.stake_net_quantity, UOS);
    const stakeCpuQuantity: number
      = BalancesHelper.getTokensAmountFromString(stakeAction.act_data.stake_cpu_quantity, UOS);

    if (stakeNetQuantity !== 0 && stakeCpuQuantity !== 0) {
      throw new MalformedProcessingError('Both net and cpu is unstaked in one action. Expected that only one resource per action.');
    }

    response.resources.net.tokens.self_delegated = stakeNetQuantity;
    response.resources.cpu.tokens.self_delegated = stakeCpuQuantity;

    return response;
  }
}

export = StakeUnstakeResourcesProcessor;
