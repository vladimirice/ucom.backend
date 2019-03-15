import { OneUserAirdropDto, OneUserAirdropFilter } from '../interfaces/dto-interfaces';

class UsersAirdropService {
  public static async getOneUserAirdrop(
    // @ts-ignore
    usersExternalId: number,
    filters: OneUserAirdropFilter,
  ): Promise<OneUserAirdropDto> {
    return {
      airdrop_id: filters.airdrop_id,
      user_id:  null, // null only if airdrop_status = new
      github_score: 550.044,
      airdrop_status: 1, // new
      conditions: {
        auth_github: true,
        auth_myself: false,
        following_devExchange: false,
      },
      tokens: [
        {
          amount_claim: 50025,
          symbol: 'UOS',
        },
        {
          amount_claim: 82678,
          symbol: 'FN',
        },
      ],
    };
  }
}

export = UsersAirdropService;
