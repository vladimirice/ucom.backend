import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import RequestHelper = require('../../integration/helpers/request-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');

class UserProfileRequest {
  public static async sendNewProfileTransaction(
    myself: UserModel,
    signedTransaction: any,
    expectedStatus: number = 201,
  ): Promise<IResponseBody> {
    const url     = `${RequestHelper.getMyselfUrl()}/transactions/registration-profile`;
    const request = RequestHelper.getRequestObjForPostWithMyself(url, myself);

    const fields = {
      signed_transaction: signedTransaction,
    };

    RequestHelper.addFormFieldsToRequestWithStringify(request, fields);

    const response = await request;
    ResponseHelper.expectStatusToBe(response, expectedStatus);

    const { body } = response;

    if (expectedStatus === 200) {
      expect(body.success).toBe(true);
    }

    return body;
  }
}

export = UserProfileRequest;
