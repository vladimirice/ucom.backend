import { IRequestBody } from '../../../common/interfaces/common-types';
import { BadRequestError, getErrorMessagePair } from '../../../api/errors';

import EosApi = require('../../eosApi');

class EosInputProcessor {
  public static async processWithIsMultiSignatureForCreation(
    body: IRequestBody, accountNameField: string, isMultiSignature: boolean,
  ): Promise<string> {
    EosInputProcessor.isBlockchainIdOrError(body);

    if (isMultiSignature) {
      EosInputProcessor.isNotSignedTransactionOrError(body);

      const doesExist = await EosApi.doesAccountExist(body[accountNameField]);

      if (!doesExist) {
        throw new BadRequestError(`There is no such account in the blockchain: ${body[accountNameField]}`);
      }
    } else {
      EosInputProcessor.isSignedTransactionOrError(body);
    }

    return body.signed_transaction || '';
  }

  public static isSignedTransactionOrError(body: IRequestBody): void {
    if (!body.signed_transaction) {
      throw new BadRequestError(getErrorMessagePair('signed_transaction', 'Field signed_transaction is required'));
    }
  }

  public static isNotSignedTransactionOrError(body: IRequestBody): void {
    if (typeof body.signed_transaction !== 'undefined') {
      throw new BadRequestError(
        'If is_multi_signature = true then signed_transaction must not be set. Sign everything on frontend.',
      );
    }
  }

  public static isBlockchainIdOrError(body: IRequestBody): void {
    if (!body.blockchain_id) {
      throw new BadRequestError(getErrorMessagePair('blockchain_id', 'Field blockchain_id is required'));
    }
  }
}

export = EosInputProcessor;
