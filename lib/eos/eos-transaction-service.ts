import { IActivityOptions } from './interfaces/activity-interfaces';
import { AppError } from '../api/errors';

class EosTransactionService {
  public static getEosVersionBasedOnSignedTransaction(signedTransaction: string): IActivityOptions {
    if (!signedTransaction) {
      throw new AppError('Signed transaction must be determined');
    }

    return {
      eosJsV2: signedTransaction.includes('serializedTransaction'),
    };
  }
}

export = EosTransactionService;
