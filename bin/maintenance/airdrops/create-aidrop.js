"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
const AirdropCreatorService = require("../../../lib/airdrops/service/airdrop-creator-service");
const STAGING_POST_ID = 14317;
const STAGING_ORG_ID = 107;
(async () => {
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
    community_id_to_follow: STAGING_ORG_ID,
  };
  const startedAt = '2019-04-15T14:51:35Z';
  const finishedAt = '2019-06-30T14:51:35Z';
  await AirdropCreatorService.createNewAirdrop(title, STAGING_POST_ID, conditions, startedAt, finishedAt, tokens);
})();
