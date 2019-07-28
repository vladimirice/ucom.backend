import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

class AffiliatesResponse {
  public static getAffiliatesActionData(body: IResponseBody) {
    return body.affiliates_actions[0];
  }

  public static getAccountNameSourceFromResponse(body: IResponseBody): string {
    return body.affiliates_actions[0].account_name_source;
  }
}

export = AffiliatesResponse;
