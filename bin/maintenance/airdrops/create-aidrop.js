"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../lib/api/errors");
const AirdropCreatorService = require("../../../lib/airdrops/service/airdrop-creator-service");
const EnvHelper = require("../../../lib/common/helper/env-helper");
const STAGING_POST_ID = 14317;
const STAGING_ORG_ID = 107;
const PRODUCTION_POST_ID = 5548;
const PRODUCTION_ORG_ID = 105;
(async () => {
    let postId;
    let orgId;
    if (EnvHelper.isStagingEnv()) {
        postId = STAGING_POST_ID;
        orgId = STAGING_ORG_ID;
    }
    else if (EnvHelper.isProductionEnv()) {
        postId = PRODUCTION_POST_ID;
        orgId = PRODUCTION_ORG_ID;
    }
    else {
        throw new errors_1.AppError(`Unsupported env: ${EnvHelper.getNodeEnv()}`, 500);
    }
    const tokens = [
        {
            symbol_id: 2,
            amount: 500000 * (10 ** 4),
        },
        {
            symbol_id: 3,
            amount: 300000 * (10 ** 4),
        },
    ];
    const title = 'github_airdrop';
    const conditions = {
        auth_github: true,
        auth_myself: true,
        community_id_to_follow: orgId,
    };
    const startedAt = '2019-04-15T14:51:35Z';
    const finishedAt = '2019-06-30T14:51:35Z';
    await AirdropCreatorService.createNewAirdrop(title, postId, conditions, startedAt, finishedAt, tokens);
})();
