"use strict";
class UsersAirdropService {
    static async getOneUserAirdrop(
    // @ts-ignore
    usersExternalId, filters) {
        return {
            airdrop_id: filters.airdrop_id,
            user_id: null,
            github_score: 550.044,
            airdrop_status: 1,
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
module.exports = UsersAirdropService;
