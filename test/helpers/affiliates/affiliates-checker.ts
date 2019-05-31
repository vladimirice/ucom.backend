import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

class AffiliatesChecker {
  public static expectWinnerIs(responseBody: any, expectedWinner: UserModel): void {
    expect(responseBody.actions[0].account_name_source).toBe(expectedWinner.account_name);
  }
}

export = AffiliatesChecker;
