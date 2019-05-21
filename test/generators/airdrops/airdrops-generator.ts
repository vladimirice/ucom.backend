import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import PostsGenerator = require('../posts-generator');

import OrganizationsGenerator = require('../organizations-generator');
import AirdropCreatorService = require('../../../lib/airdrops/service/airdrop-creator-service');

import _ = require('lodash');
import AirdropsModelProvider = require('../../../lib/airdrops/service/airdrops-model-provider');

class AirdropsGenerator {
  public static async createNewGithubRoundTwoAirdrop(
    postAuthor: UserModel,
  ): Promise<any> {
    const givenConditions = {
      zero_score_incentive_tokens_amount: 100,
      source_table_name: AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName(),
    };

    return this.createNewAirdrop(postAuthor, givenConditions);
  }

  public static async createNewAirdrop(
    postAuthor: UserModel,
    givenConditions = {},
  ): Promise<any> {
    const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(postAuthor);
    const postId = await PostsGenerator.createMediaPostOfOrganization(postAuthor, orgId);

    const firstSymbolAmount = 1000000 * (10 ** 4);
    const secondSymbolAmount = 2000000 * (10 ** 4);

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
    };

    const conditions = _.defaults(givenConditions, defaultConditions);

    const startedAt = '2019-04-01T14:51:35Z';
    const finishedAt = '2019-05-30T14:51:35Z';

    const { airdropId } = await AirdropCreatorService.createNewAirdrop(
      title,
      postId,
      conditions,
      startedAt,
      finishedAt,
      tokens,
    );

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
      postId,
      orgId,
      startedAt,
      finishedAt,

      expectedTokens,
    };
  }
}

export = AirdropsGenerator;
