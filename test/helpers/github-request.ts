import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const apiV1Prefix = RequestHelper.getApiV1Prefix();

const githubConfig = require('config').github;

class GithubRequest {
  public static async sendSampleGithubCallbackAndGetToken(
    code: string,
    mockExternalId: boolean = false,
  ): Promise<string> {
    const res = await GithubRequest.sendSampleGithubCallback(code, mockExternalId);

    expect(Array.isArray(res.headers['set-cookie'])).toBeTruthy();
    expect(res.headers['set-cookie'].length).toBe(1);

    const githubTokenCookie = res.headers['set-cookie'][0].split(';')[0].split('=');

    return githubTokenCookie[1];
  }

  public static async sendSampleGithubCallback(code: string, mockExternalId: boolean = false) {
    const url = this.getBackendCallbackUrl();

    let redirectLocation = 'https://staging.u.community/';
    // let redirectLocation = 'https://staging.u.community/?mock_external_id=true';
    if (mockExternalId) {
      redirectLocation += '?mock_external_id=true';
    }

    const qs = `?redirect_uri=${redirectLocation}&code=${code}&state=${githubConfig.state}`;

    const req = RequestHelper.getRequestObj();

    const res = await req.get(`${url}${qs}`);

    ResponseHelper.expectStatusTempRedirect(res);
    expect(res.headers.location).toBe(redirectLocation);

    return res;
  }

  private static getBackendCallbackUrl(): string {
    return `${apiV1Prefix}/github/auth_callback`;
  }
}

export = GithubRequest;
