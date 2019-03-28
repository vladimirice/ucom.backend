import { BadRequestError } from '../../api/errors';

class SignedTransactionValidator {
  public static validateBodyWithBadRequestError(body: any): void {
    if (this.validateItSelf(body.signed_transaction)) {
      return;
    }

    throw new BadRequestError(
      `There is no signed_transaction string field in body or it is malformed. Provided body is: ${JSON.stringify(body)}`,
      400,
    );
  }

  public static validateItSelf(signedTransaction: any): boolean {
    return typeof signedTransaction === 'string'
      && signedTransaction.length > 0;
  }
}

export = SignedTransactionValidator;
