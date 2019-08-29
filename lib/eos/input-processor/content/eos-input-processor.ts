import { IRequestBody } from '../../../common/interfaces/common-types';
import { BadRequestError, getErrorMessagePair } from '../../../api/errors';

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
}

export = EosInputProcessor;
