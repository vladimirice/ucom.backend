import { IRequestBody } from '../../../common/interfaces/common-types';
import { BadRequestError, getErrorMessagePair } from '../../../api/errors';

import EosContentInputProcessor = require('./eos-content-input-processor');

class EosInputProcessor {
  public static isSignedTransactionOrError(body: IRequestBody): void {
    if (!body.signed_transaction) {
      throw new BadRequestError(getErrorMessagePair('signed_transaction', 'Field signed_transaction is required'));
    }
  }

  public static isBlockchainIdOrError(body: IRequestBody): void {
    if (!body.blockchain_id) {
      throw new BadRequestError(getErrorMessagePair('blockchain_id', 'Field blockchain_id is required'));
    }
  }


  public static addSignedTransactionDetailsFromRequest(body: IRequestBody): boolean {
    const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);

    if (transactionDetails === null) {
      return false;
    }

    body.blockchain_id      = transactionDetails.blockchain_id;
    body.signed_transaction = transactionDetails.signed_transaction;

    return true;
  }
}

export = EosInputProcessor;
