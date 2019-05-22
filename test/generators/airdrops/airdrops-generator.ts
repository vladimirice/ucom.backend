import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IAirdrop } from '../../../lib/airdrops/interfaces/model-interfaces';

import PostsGenerator = require('../posts-generator');

import OrganizationsGenerator = require('../organizations-generator');
import AirdropCreatorService = require('../../../lib/airdrops/service/airdrop-creator-service');

import _ = require('lodash');
import AirdropsModelProvider = require('../../../lib/airdrops/service/airdrops-model-provider');

import AirdropsFetchRepository = require('../../../lib/airdrops/repository/airdrops-fetch-repository');
import moment = require('moment');
import DatetimeHelper = require('../../../lib/common/helper/datetime-helper');

class AirdropsGenerator {
  public static async createNewGithubRoundTwoAirdropWithTheSecond(
    postAuthor: UserModel,
  ): Promise<any> {
    await AirdropsGenerator.createNewAirdrop(postAuthor);

    return this.createNewGithubRoundTwo(postAuthor);
  }

  public static async createNewGithubRoundTwo(
    postAuthor: UserModel,
    airdropInProcessType: number = 2,
  ): Promise<any> {
    await AirdropsGenerator.createNewAirdrop(postAuthor);

    const givenConditions = {
      zero_score_incentive_tokens_amount: 100 * (10 ** 4),
      source_table_name: AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName(),
    };

    return this.createNewAirdrop(postAuthor, givenConditions, 1000000, airdropInProcessType);
  }

  public static async createNewAirdrop(
    postAuthor: UserModel,
    givenConditions = {},
    tokensEmission = 2000000,
    airdropInProcessType: number = 2,
  ): Promise<{
    airdropId: number,
    airdrop: IAirdrop
    postId: number,
    orgId: number,
    startedAt: any,
    finishedAt: any,
    expectedTokens: any,
  }> {
    const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(postAuthor);
    const postId = await PostsGenerator.createMediaPostOfOrganization(postAuthor, orgId);

    const firstSymbolAmount = tokensEmission * (10 ** 4);
    const secondSymbolAmount = tokensEmission * (10 ** 4);

    const tokens = [
      {
        symbol_id: 2,
        amount: firstSymbolAmount,
      },
      {
        symbol_id: 3,
        amount: secondSymbolAmount,
      },
    ];

    const title = 'github_airdrop';

    const defaultConditions = {
      auth_github: true,
      auth_myself: true,
      community_id_to_follow: orgId,
      source_table_name: AirdropsModelProvider.airdropsUsersGithubRawTableName(),
      zero_score_incentive_tokens_amount: 0,
    };

    const conditions = _.defaults(givenConditions, defaultConditions);

    let startedAt;
    let finishedAt;

    switch (airdropInProcessType) {
      case 1: // not started yet
        startedAt = DatetimeHelper.getMomentInUtcString(moment().add(2, 'days'));
        finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));
        break;
      case 2: // in process
        startedAt = DatetimeHelper.getMomentInUtcString(moment().subtract(2, 'days'));
        finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));
        break;
      case 3: // finished
        startedAt = DatetimeHelper.getMomentInUtcString(moment().subtract(10, 'days'));
        finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(5, 'days'));
        break;
      default:
        throw new TypeError(`Unsupported type ${airdropInProcessType}`);
    }


    const { airdropId } = await AirdropCreatorService.createNewAirdrop(
      title,
      postId,
      conditions,
      startedAt,
      finishedAt,
      tokens,
    );

    const airdrop: IAirdrop = await AirdropsFetchRepository.getAirdropByPk(airdropId);

    const expectedTokens = [
      {
        symbol: 'UOSTEST',
        amount_claim: firstSymbolAmount / (10 ** 4),
        amount_left: firstSymbolAmount / (10 ** 4),
      },
      {
        symbol: 'GHTEST',
        amount_claim: secondSymbolAmount / (10 ** 4),
        amount_left: secondSymbolAmount / (10 ** 4),
      },
    ];

    return {
      airdropId,
      airdrop,
      postId,
      orgId,
      startedAt,
      finishedAt,

      expectedTokens,
    };
  }
}

export = AirdropsGenerator;
