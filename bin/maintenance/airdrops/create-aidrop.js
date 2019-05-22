"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const errors_1 = require("../../../lib/api/errors");
const AirdropCreatorService = require("../../../lib/airdrops/service/airdrop-creator-service");
const EnvHelper = require("../../../lib/common/helper/env-helper");
const AirdropsModelProvider = require("../../../lib/airdrops/service/airdrops-model-provider");
const STAGING_POST_ID = 14317;
const STAGING_ORG_ID = 107;
const STAGING_FIRST_SYMBOL_ID = 2;
const STAGING_SECOND_SYMBOL_ID = 3;
const PRODUCTION_POST_ID = 5548;
const PRODUCTION_ORG_ID = 105;
const PRODUCTION_FIRST_SYMBOL_ID = 1;
const PRODUCTION_SECOND_SYMBOL_ID = 4;
const SOURCE_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName();
const ZERO_SCORE_INCENTIVE_TOKENS_AMOUNT_IN_MAJOR = 100;
const EMISSION_IN_MAJOR = 1000000;
const title = 'github_airdrop_round_two';
const startedAt = '2019-05-21T12:00:00Z';
const finishedAt = '2019-06-21T12:00:00Z';
(async () => {
    let postId;
    let orgId;
    let firstSymbolId;
    let secondSymbolId;
    if (EnvHelper.isStagingEnv()) {
        postId = STAGING_POST_ID;
        orgId = STAGING_ORG_ID;
        firstSymbolId = STAGING_FIRST_SYMBOL_ID;
        secondSymbolId = STAGING_SECOND_SYMBOL_ID;
    }
    else if (EnvHelper.isProductionEnv()) {
        postId = PRODUCTION_POST_ID;
        orgId = PRODUCTION_ORG_ID;
        firstSymbolId = PRODUCTION_FIRST_SYMBOL_ID;
        secondSymbolId = PRODUCTION_SECOND_SYMBOL_ID;
    }
    else {
        throw new errors_1.AppError(`Unsupported env: ${EnvHelper.getNodeEnv()}`, 500);
    }
    const tokens = [
        {
            symbol_id: firstSymbolId,
            amount: EMISSION_IN_MAJOR * (10 ** 4),
        },
        {
            symbol_id: secondSymbolId,
            amount: EMISSION_IN_MAJOR * (10 ** 4),
        },
    ];
    const conditions = {
        source_table_name: SOURCE_TABLE_NAME,
        zero_score_incentive_tokens_amount: ZERO_SCORE_INCENTIVE_TOKENS_AMOUNT_IN_MAJOR * (10 ** 4),
        auth_github: true,
        auth_myself: true,
        community_id_to_follow: orgId,
    };
    const { airdropId } = await AirdropCreatorService.createNewAirdrop(title, postId, conditions, startedAt, finishedAt, tokens);
    console.log(`Airdrop is created. Airdrop ID is: ${airdropId}`);
})();
