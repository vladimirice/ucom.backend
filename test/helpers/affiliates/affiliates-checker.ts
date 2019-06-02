import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';
import CommonChecker = require('../common/common-checker');

class AffiliatesChecker {
  public static expectWinnerIs(responseBody: IResponseBody, expectedWinner: UserModel): void {
    expect(responseBody.affiliates_actions[0].account_name_source).toBe(expectedWinner.account_name);
  }

  public static checkAffiliatesActionsResponse(responseBody): void {
    CommonChecker.expectNotEmptyArray(responseBody.affiliates_actions);

    const expected = [
      'offer_id',
      'account_name_source',
      'action',
    ];

    CommonChecker.expectAllFieldsExistenceForObjectsArray(
      responseBody.affiliates_actions,
      expected,
    );
  }
}

export = AffiliatesChecker;
