import { IActivityOptions } from './interfaces/activity-interfaces';
import { UserModel } from '../users/interfaces/model-interfaces';
import { IRequestBody } from '../common/interfaces/common-types';
import { AppError } from '../api/errors';

const { TransactionFactory } = require('ucom-libs-social-transactions');

class EosTransactionService {
  public static async appendSignedUserVotesContent(
    user: UserModel,
    body: IRequestBody,
    contentBlockchainId: string,
    interactionType: number,
  ): Promise<void> {
    if (body.signed_transaction) {
      return;
    }

    body.signed_transaction = await TransactionFactory.getSignedUserToContentActivity(
      user.account_name,
      user.private_key,
      contentBlockchainId,
      interactionType,
    );
  }

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
