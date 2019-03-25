import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../integration/helpers/graphql-helper';

import GithubRequest = require('../../helpers/github-request');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import AirdropsUsersExternalDataService = require('../../../lib/airdrops/service/airdrops-users-external-data-service');
import UsersExternalRequest = require('../../helpers/users-external-request');
import OrganizationsHelper = require('../../integration/helpers/organizations-helper');
import RequestHelper = require('../../integration/helpers/request-helper');

class AirdropsUsersGenerator {
  public static async fulfillAirdropCondition(
    airdropId: number,
    user: UserModel,
    orgId: number,
    alsoFollow: boolean = true,
  ) {
    if (!user.github_code) {
      throw new Error('Code is required to use this generator function');
    }

    const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(<string>user.github_code);

    await UsersExternalRequest.sendPairExternalUserWithUser(user, githubToken);

    if (alsoFollow) {
      await OrganizationsHelper.requestToFollowOrganization(orgId, user);
    }

    // It is required to create users_external_data record
    const headers = RequestHelper.getGithubAuthHeader(githubToken);
    return GraphqlHelper.getOneUserAirdrop(airdropId, headers);
  }

  public static getExpectedUserAirdrop(
    airdropId: number,
    usersExternalId: number,
    conditions: any,
    userId: number | null = null,
  ) {
    const commonData = AirdropsUsersExternalDataService.getUserAirdropCommonData(airdropId, usersExternalId, false);

    return {
      user_id: userId,
      airdrop_status: AirdropStatuses.NEW,
      conditions,

      ...commonData,
    };
  }
}

export = AirdropsUsersGenerator;
