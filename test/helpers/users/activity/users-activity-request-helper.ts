import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../../../integration/helpers/request-helper');

class UsersActivityRequestHelper {
  static async trustOneUser(
    whoActs: UserModel,
    targetUserId: number,
    signedTransaction: string | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const url: string = this.getTrustUrl(targetUserId);

    return this.makeActivityRequest(whoActs, url, signedTransaction, expectedStatus);
  }

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
