import { IRequestBody } from '../../../common/interfaces/common-types';
import { BadRequestError } from '../../../api/errors';

import EosInputProcessor = require('./eos-input-processor');

class EosContentInputProcessor {
  public static validateContentSignedTransactionDetailsOrError(body: IRequestBody): void {
    EosInputProcessor.isSignedTransactionOrError(body);
    EosInputProcessor.isBlockchainIdOrError(body);
  }

  public static getSignedTransactionOrNull(body): string | null {
    return body.signed_transaction || null;
  }

  private static getSignedTransactionFromBody(
    body: IRequestBody,
  ): { signed_transaction: string, blockchain_id: string } | null {
    const { signed_transaction, blockchain_id } = body;

    if (!signed_transaction && !blockchain_id) {
      return null;
    }

    if (signed_transaction && !blockchain_id) {
      throw new BadRequestError('If you provide a signed_transaction you must provide a content_id also.');
    }

    if (blockchain_id && !signed_transaction) {
      throw new BadRequestError('If you provide a content_id you must provide a signed_transaction also.');
    }

    return {
      signed_transaction,
      blockchain_id,
    };
  }

  public static areSignedTransactionUpdateDetailsOrError(body: IRequestBody): void {
    this.isSignedTransactionOrError(body);
  }

  public static isSignedTransactionOrError(body: IRequestBody): void {
    if (!body.signed_transaction) {
      throw new BadRequestError('Please provide a signed_transaction');
    }
  }

  public static areSignedTransactionDetailsOrError(body: IRequestBody): void {
    if (!this.getSignedTransactionFromBody(body)) {
      throw new BadRequestError('Please provide transaction details: blockchain_id and signed_transaction');
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

export  = EosContentInputProcessor;
