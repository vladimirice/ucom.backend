import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../integration/helpers/graphql-helper';
import { AirdropsUsersGithubRawItem, IAirdrop } from '../../../lib/airdrops/interfaces/model-interfaces';

import GithubRequest = require('../../helpers/github-request');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import AirdropsUsersExternalDataService = require('../../../lib/airdrops/service/airdrops-users-external-data-service');
import UsersExternalRequest = require('../../helpers/users-external-request');
import OrganizationsHelper = require('../../integration/helpers/organizations-helper');
import RequestHelper = require('../../integration/helpers/request-helper');
import knex = require('../../../config/knex');
import AirdropsModelProvider = require('../../../lib/airdrops/service/airdrops-model-provider');
import AirdropsFetchRepository = require('../../../lib/airdrops/repository/airdrops-fetch-repository');
import AirdropsUsersRequest = require('../../helpers/airdrops-users-request');

class AirdropsUsersGenerator {
  public static generateForVladAndJane() {
    return Promise.all([
      this.generateGithubRawDataForVlad(),
      this.generateGithubRawDataForJane(),
    ]);
  }

  public static async generateGithubRawDataForVlad() {
    return AirdropsUsersGenerator.generateAirdropsUsersGithubRawDataForUser(AirdropsUsersRequest.getVladGithubId());
  }

  public static async generateGithubRawDataForVladRoundTwo() {
    return AirdropsUsersGenerator.generateAirdropsUsersGithubRawDataForUser(
      AirdropsUsersRequest.getVladGithubId(),
      true,
      AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName()
    );
  }

  public static async generateGithubRawDataForJane() {
    return AirdropsUsersGenerator.generateAirdropsUsersGithubRawDataForUser(AirdropsUsersRequest.getJaneGithubId());
  }

  public static async generateAirdropsUsersGithubRawDataForUser(
    githubId: number,
    getInMajor: boolean = true,
    sourceTableName = AirdropsModelProvider.airdropsUsersGithubRawTableName(),
  ): Promise<AirdropsUsersGithubRawItem> {

    const amount = sourceTableName === AirdropsModelProvider.airdropsUsersGithubRawTableName() ?
      githubId + 5020 : githubId + 102100;

    const generated = {
      id: githubId,
      score: githubId + 43.424145,
      amount,
    };

    const sql = `
      INSERT INTO ${sourceTableName} (id, score, amount) 
      VALUES (${generated.id}, ${generated.score}, ${generated.amount})
    `;

    await knex.raw(sql);

    if (getInMajor) {
      return {
        id: generated.id,
        score: generated.score,
        amount: generated.amount / (10 ** 4),
      };
    }

    return generated;
  }

  public static async fulfillAllAirdropConditionForManyUsers(
    airdropId: number,
    orgId: number,
    users: UserModel[],
  ): Promise<void> {
    const promises: any[] = [];
    for (const oneUser of users) {
      promises.push(AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, oneUser, orgId, true));
    }

    await Promise.all(promises);
  }

  public static async fulfillAirdropCondition(
    airdropId: number,
    user: UserModel,
    orgId: number,
    alsoFollow: boolean = true,
    customGithubCode: string | null = null,
  ) {
    if (!user.github_code) {
      throw new Error('Code is required to use this generator function');
    }

    const githubCode: string = customGithubCode || <string>user.github_code;

    const githubToken = await GithubRequest.sendSampleGithubCallbackAndGetToken(githubCode);

    await UsersExternalRequest.sendPairExternalUserWithUser(user, githubToken);

    if (alsoFollow) {
      await OrganizationsHelper.requestToFollowOrganization(orgId, user);
    }

    // It is required to create users_external_data record
    const headers = RequestHelper.getGithubAuthHeader(githubToken);
    return GraphqlHelper.getOneUserAirdrop(airdropId, headers);
  }

  public static async getExpectedUserAirdrop(
    airdropId: number,
    usersExternalId: number,
    conditions: any,
    userId: number | null = null,
    airdropStatus: number = AirdropStatuses.NEW,
  ) {
    const airdrop: IAirdrop = await AirdropsFetchRepository.getAirdropByPk(airdropId);
    const commonData = await AirdropsUsersExternalDataService.getUserAirdropCommonData(airdrop, usersExternalId, true);

    return {
      user_id: userId,
      airdrop_status: airdropStatus,
      conditions,

      ...commonData,
    };
  }
}

export = AirdropsUsersGenerator;
