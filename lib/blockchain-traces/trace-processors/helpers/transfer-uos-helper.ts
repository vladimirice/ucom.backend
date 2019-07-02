import { ValidationError } from 'joi';
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import { UOS, UOS_REGEX } from '../../../common/dictionary/symbols-dictionary';
import { ITraceAction, ITraceActionTransferTokens } from '../../interfaces/blockchain-actions-interfaces';
import { MalformedProcessingError } from '../processor-errors';

import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');

const joi = require('joi');

class TransferUosHelper {
  public static getValidationSchema(): StringToAnyCollection {
    return {
      from:               joi.string().required().min(1).max(12),
      to:                 joi.string().required().min(1).max(12),
      quantity:           joi.string().required().regex(UOS_REGEX),
      memo:               joi.string().empty(''),
    };
  }

  public static validateTraceActDataOrMalformed(traceAction: ITraceAction): void {
    const { error }: { error: ValidationError } = joi.validate(
      traceAction.act_data,
      TransferUosHelper.getValidationSchema(),
      {
        abortEarly: false,
        allowUnknown: false,
      },
    );

    if (error) {
      throw new MalformedProcessingError(JSON.stringify(error));
    }
  }

  public static getQuantity(traceAction: ITraceActionTransferTokens): number {
    return BalancesHelper.getTokensAmountFromString(traceAction.act_data.quantity, UOS);
  }
}

export = TransferUosHelper;
