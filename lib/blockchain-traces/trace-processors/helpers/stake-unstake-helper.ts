import { UOS, UOS_REGEX } from '../../../common/dictionary/symbols-dictionary';

const joi = require('joi');

class StakeUnstakeHelper {
  public static getDelegateBwValidationSchema() {
    return {
      from:               joi.string().required().min(1).max(12),
      receiver:           joi.string().required().min(1).max(12),
      stake_net_quantity: joi.string().required().regex(UOS_REGEX),
      stake_cpu_quantity: joi.string().required().regex(UOS_REGEX),
      transfer:           joi.number().required(),
    };
  }

  public static getUndelegateBwValidationSchema() {
    return {
      from:                 joi.string().required().min(1).max(12),
      receiver:             joi.string().required().min(1).max(12),
      unstake_net_quantity: joi.string().required().regex(UOS_REGEX),
      unstake_cpu_quantity: joi.string().required().regex(UOS_REGEX),
    };
  }

  public static getEmptyThumbnail() {
    return {
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
  }
}

export = StakeUnstakeHelper;
