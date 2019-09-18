import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { FAKE_BLOCKCHAIN_ID, FAKE_SIGNED_TRANSACTION } from '../../../generators/common/fake-data-generator';

import RequestHelper = require('../../../integration/helpers/request-helper');

class UsersActivityRequestHelper {
  public static async trustOneUserWithMockTransaction(
    whoActs: UserModel,
    targetUserId: number,
  ): Promise<any> {
    const signedTransaction = 'sample_one';

    return this.trustOneUser(whoActs, targetUserId, signedTransaction);
  }

  public static async untrustOneUserWithMockTransaction(
    whoActs: UserModel,
    targetUserId: number,
  ): Promise<any> {
    const signedTransaction = 'sample_one';

    return this.untrustOneUser(whoActs, targetUserId, signedTransaction);
  }

  /**
   * @deprecated - legacy
   * @see - trustOneUserWithAutoUpdate
   *
   */
  static async trustOneUser(
    whoActs: UserModel,
    targetUserId: number,
    signedTransaction: string | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const url: string = this.getTrustUrl(targetUserId);

    return this.makeActivityRequest(whoActs, url, signedTransaction, expectedStatus);
  }

  public static async trustOneUserWithFakeAutoUpdate(
    myself: UserModel,
    targetUserId: number,
  ): Promise<any> {
    return this.trustOneUserWithAutoUpdate(myself, targetUserId, FAKE_BLOCKCHAIN_ID, FAKE_SIGNED_TRANSACTION);
  }

  public static async trustOneUserWithAutoUpdate(
    myself: UserModel,
    targetUserId: number,
    blockchainId: string,
    signedTransaction: string,
  ): Promise<any> {
    const url: string = this.getTrustUrl(targetUserId);

    const fields = {
      signed_transaction: signedTransaction,
      blockchain_id:      blockchainId,
    };

    return RequestHelper.makePostRequestAsMyselfWithFields(url, myself, fields, 201);
  }

  public static async untrustOneUserWithAutoUpdate(
    myself: UserModel,
    targetUserId: number,
    blockchainId: string,
    signedTransaction: string,
  ): Promise<any> {
    const url: string = this.getUntrustUrl(targetUserId);

    const fields = {
      signed_transaction: signedTransaction,
      blockchain_id:      blockchainId,
    };

    return RequestHelper.makePostRequestAsMyselfWithFields(url, myself, fields, 201);
  }

  /**
   * @deprecated Legacy
   * @see untrustOneUserWithAutoUpdate
   */
  static async untrustOneUser(
    whoActs: UserModel,
    targetUserId: number,
    signedTransaction: string | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const url: string = this.getUntrustUrl(targetUserId);

    return this.makeActivityRequest(whoActs, url, signedTransaction, expectedStatus);
  }

  private static async makeActivityRequest(
    myself: UserModel,
    url: string,
    signedTransaction: string | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const req = RequestHelper.getRequestObjForPost(url);

    if (signedTransaction !== null) {
      req.field('signed_transaction', signedTransaction);
    }

    RequestHelper.addAuthToken(req, myself);

    return RequestHelper.makeRequestAndGetBody(req, expectedStatus);
  }

  private static getTrustUrl(userId: number): string {
    return `${RequestHelper.getOneUserUrlV1(userId)}/trust`;
  }

  private static getUntrustUrl(userId: number): string {
    return `${RequestHelper.getOneUserUrlV1(userId)}/untrust`;
  }
}

export = UsersActivityRequestHelper;
