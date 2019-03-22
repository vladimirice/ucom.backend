"use strict";
const AirdropsFetchRepository = require("../repository/airdrops-fetch-repository");
const moment = require("moment");
class AirdropFetchService {
    static async addDataForGithubAirdropOffer(post) {
        const state = await AirdropsFetchRepository.getAirdropStateByPostId(post.id);
        const tokens = [];
        state.tokens.forEach((item) => {
            tokens.push({
                amount_claim: item.amount_claim / (10 ** item.precision),
                amount_left: (item.amount_claim - 50000000) / (10 ** item.precision),
                symbol: item.symbol,
            });
        });
        post.started_at = moment(state.startedAt).utc().format();
        post.finished_at = moment(state.finishedAt).utc().format();
        post.post_offer_type_id = 1; // #task - reserved for future uses
        post.users_team = {
            data: [
                {
                    id: 1,
                    account_name: 'vladvladvlad',
                    first_name: 'Vlad',
                    last_name: 'Ivanov',
                    nickname: 'vladvladvlad',
                    avatar_filename: null,
                    current_rate: 16.21,
                },
                {
                    id: 2,
                    account_name: 'janejanejane',
                    first_name: 'Jane',
                    last_name: 'Sidorova',
                    nickname: 'janejanejane',
                    avatar_filename: null,
                    current_rate: 55.14,
                },
                {
                    id: 3,
                    account_name: 'petrpetrpetr',
                    first_name: 'Petr',
                    last_name: 'Smirnov',
                    nickname: 'petrpetrpetr',
                    avatar_filename: null,
                    current_rate: 74.89,
                },
            ],
            metadata: {
                page: 1,
                per_page: 3,
                total_amount: 20,
                has_more: true,
            },
        };
        post.offer_data = {
            airdrop_id: state.airdropId,
            tokens,
        };
    }
}
module.exports = AirdropFetchService;
