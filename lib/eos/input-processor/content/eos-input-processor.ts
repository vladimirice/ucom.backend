import { IRequestBody } from '../../../common/interfaces/common-types';
import { BadRequestError, getErrorMessagePair } from '../../../api/errors';

class EosInputProcessor {
  public static processWithIsMultiSignatureForCreation(body: IRequestBody): string {
    const { is_multi_signature } = body;
    EosInputProcessor.isBlockchainIdOrError(body);

    if (is_multi_signature) {
      EosInputProcessor.isNotSignedTransactionOrError(body);
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
