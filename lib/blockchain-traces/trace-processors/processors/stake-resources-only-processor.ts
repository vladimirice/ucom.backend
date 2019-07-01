/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionDelegateBw,
} from '../../interfaces/blockchain-actions-interfaces';
import { UOS, UOS_REGEX } from '../../../common/dictionary/symbols-dictionary';
import { MalformedProcessingError } from '../processor-errors';

import AbstractTracesProcessor = require('../abstract-traces-processor');
import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

class StakeResourcesOnlyProcessor extends AbstractTracesProcessor {
  readonly expectedActionsData = {
    delegatebw: {
      validationSchema: {
        from:               joi.string().required().min(1).max(12),
        receiver:           joi.string().required().min(1).max(12),
        stake_net_quantity: joi.string().required().regex(UOS_REGEX),
        stake_cpu_quantity: joi.string().required().regex(UOS_REGEX),
        transfer:           joi.number().required(),
      },

      minNumberOfActions:   1, // CPU/NET only
      maxNumberOfActions:   2, // Both CPU and NET
    },
  };

  readonly serviceName = 'stake-resources-only';

  readonly traceType: number = BlockchainTrTraces.getTypeStakeResources();

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionDelegateBw>actNameToActionDataArray.delegatebw[0];

    return {
      from: actionData.act_data.from,
      memo: '',
      to: null,
    };
  }

  // @ts-ignore
  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const response = {
      resources: {
        cpu: {
          tokens: {
            currency: UOS,
            self_delegated: 0,
          },
          unstaking_request: {
            amount: 0, // quantity
            currency: UOS,
          },
        },
        net: {
          tokens: {
            currency: UOS,
            self_delegated: 0,
          },
          unstaking_request: {
            amount: 0, // quantity
            currency: UOS,
          },
        },
      },
    };

    const manyActions = <ITraceActionDelegateBw[]>actNameToActionDataArray.delegatebw;

    let cpuQuantity: number = 0;
    let netQuantity: number = 0;
    for (const action of manyActions) {
      const givenCpuQuantity: number =
        BalancesHelper.getTokensAmountFromString(action.act_data.stake_cpu_quantity, UOS);
      const givenNetQuantity: number =
        BalancesHelper.getTokensAmountFromString(action.act_data.stake_net_quantity, UOS);

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

    response.resources.cpu.tokens.self_delegated = cpuQuantity;
    response.resources.net.tokens.self_delegated = netQuantity;

    return response;
  }
}

export = StakeResourcesOnlyProcessor;
