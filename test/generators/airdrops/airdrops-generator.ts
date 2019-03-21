import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import PostsGenerator = require('../posts-generator');

import OrganizationsGenerator = require('../organizations-generator');
import AirdropCreatorService = require('../../../lib/airdrops/service/airdrop-creator-service');

class AirdropsGenerator {
  public static getExpectedUserAirdrop(
    conditions: any,
    userId: number | null = null,
  ) {
    return {
      airdrop_id: 1,
      user_id: userId,
      score: 550.044,
      airdrop_status: 1, // new
      conditions,
      tokens: [
        {
          amount_claim: 50025,
          symbol: 'UOSTEST',
        },
        {
          amount_claim: 82678,
          symbol: 'GHTEST',
        },
      ],
    };
  }

  public static async createNewAirdrop(postAuthor: UserModel) {
    const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(postAuthor);
    const postId = await PostsGenerator.createMediaPostOfOrganization(postAuthor, orgId);

    const tokens = [
      {
        symbol_id: 2,
        amount: 300000,
      },
      {
        symbol_id: 3,
        amount: 100000,
      },
    ];

    const title = 'github_airdrop';
    const conditions = {
      auth_github: true,
      auth_myself: true,
      community_id_to_follow: orgId,
    };

    const startedAt = '2019-04-01T14:51:35Z';
    const finishedAt = '2019-05-30T14:51:35Z';

    const {airdropId} = await AirdropCreatorService.createNewAirdrop(
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
        amount_claim: 30,
        amount_left: 25,
      },
      {
        symbol: 'GHTEST',
        amount_claim: 10,
        amount_left: 5,
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
