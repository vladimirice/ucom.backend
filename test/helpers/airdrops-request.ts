import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const apiV1Prefix = RequestHelper.getApiV1Prefix();

class AirdropsRequest {
  public static async getUserAirdropStatus(cookieWithToken: string) {
    const url = this.getAirdropsGithubSummerUserUrl();

    const req = RequestHelper.getRequestObj();

    const res = await req.get(url).set('Cookie', cookieWithToken);

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  private static getAirdropsGithubSummerUserUrl(): string {
    return `${apiV1Prefix}/airdrops/1/user`;
  }
}

export = AirdropsRequest;
