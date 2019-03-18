import { UserModel } from '../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const apiV1Prefix = RequestHelper.getApiV1Prefix();

class UsersExternalRequest {
  public static async sendPairExternalUserWithUser(
    myself: UserModel | null = null,
    githubAuthToken: string | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const url = this.getUsersExternalPairUrl();
    const req = RequestHelper.getRequestObjForPost(url);

    if (myself) {
      RequestHelper.addAuthToken(req, myself);
    }

    if (githubAuthToken) {
      RequestHelper.addGithubAuthToken(req, githubAuthToken);
    }

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res;
  }

  private static getUsersExternalPairUrl(): string {
    return `${apiV1Prefix}/users-external/users/pair`;
  }
}

export = UsersExternalRequest;
