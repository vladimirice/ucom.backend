import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const apiV1Prefix = RequestHelper.getApiV1Prefix();

const githubConfig = require('config').github;

class GithubRequest {
  public static async sendSampleGithubCallback(code: string) {
    const url = this.getBackendCallbackUrl();

    const redirectLocation = 'https://u.community/users';
    const qs = `?redirect_uri=${redirectLocation}&code=${code}&state=${githubConfig.state}`;

    const req = RequestHelper.getRequestObj();

    const res = await req.get(`${url}${qs}`);

    ResponseHelper.expectStatusTempRedirect(res);
    expect(res.headers.location).toBe(redirectLocation);

    return res.body;
  }

  private static getBackendCallbackUrl(): string {
    return `${apiV1Prefix}/github/auth_callback`;
  }
}

export = GithubRequest;
