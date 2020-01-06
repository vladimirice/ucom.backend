/* eslint-disable no-console */

import { AppError } from '../../api/errors';
import { IAirdropConditions } from '../interfaces/model-interfaces';

import AirdropCreatorService = require('../../../lib/airdrops/service/airdrop-creator-service');
import EnvHelper = require('../../../lib/common/helper/env-helper');
import AirdropsModelProvider = require('../../../lib/airdrops/service/airdrops-model-provider');
import CurrencyHelper = require('../../common/helper/CurrencyHelper');
import CloseHandlersHelper = require('../../common/helper/close-handlers-helper');

const TEST_POST_ID = 2;
const TEST_ORG_ID = 1;

const STAGING_POST_ID = 14317;
const STAGING_ORG_ID = 107;
const STAGING_FIRST_SYMBOL_ID = 2;
const STAGING_SECOND_SYMBOL_ID = 3;

const PRODUCTION_POST_ID = 8050;
const PRODUCTION_ORG_ID = 101;

const PRODUCTION_FIRST_SYMBOL_ID = 1;
const PRODUCTION_SECOND_SYMBOL_ID = 4;


const SOURCE_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName();
const ZERO_SCORE_INCENTIVE_TOKENS_AMOUNT_IN_MAJOR = 100;

const EMISSION_IN_MAJOR = 1000000;

const title       = 'github_airdrop_round_two';
const startedAt   = '2019-05-27T12:00:00Z';
const finishedAt  = '2019-06-10T12:00:00Z';

(async () => {
  let postId: number;
  let orgId: number;
  let firstSymbolId: number;
  let secondSymbolId: number;

  if (EnvHelper.isTestEnv()) {
    postId = TEST_POST_ID;
    orgId = TEST_ORG_ID;
    firstSymbolId = STAGING_FIRST_SYMBOL_ID;
    secondSymbolId = STAGING_SECOND_SYMBOL_ID;
  } else if (EnvHelper.isStagingEnv()) {
    postId = STAGING_POST_ID;
    orgId = STAGING_ORG_ID;
    firstSymbolId = STAGING_FIRST_SYMBOL_ID;
    secondSymbolId = STAGING_SECOND_SYMBOL_ID;
  } else if (EnvHelper.isProductionEnv()) {
    postId = PRODUCTION_POST_ID;
    orgId = PRODUCTION_ORG_ID;

    firstSymbolId = PRODUCTION_FIRST_SYMBOL_ID;
    secondSymbolId = PRODUCTION_SECOND_SYMBOL_ID;
  } else {
    throw new AppError(`Unsupported env: ${EnvHelper.getNodeEnv()}`, 500);
  }

  const tokens = [
    {
      symbol_id: firstSymbolId,
      amount: CurrencyHelper.convertToUosMinor(EMISSION_IN_MAJOR),
    },
    {
      symbol_id: secondSymbolId,
      amount: CurrencyHelper.convertToUosMinor(EMISSION_IN_MAJOR),
    },
  ];

  const conditions: IAirdropConditions = {
    source_table_name: SOURCE_TABLE_NAME,
    zero_score_incentive_tokens_amount: CurrencyHelper.convertToUosMinor(ZERO_SCORE_INCENTIVE_TOKENS_AMOUNT_IN_MAJOR),
    auth_github: true,
    auth_myself: true,
    community_id_to_follow: orgId,
  };

  const { airdropId } = await AirdropCreatorService.createNewAirdrop(
    title,
    postId,
    conditions,
    startedAt,
    finishedAt,
    tokens,
  );

  await CloseHandlersHelper.closeDbConnections();

  console.log(`Airdrop is created. Airdrop ID is: ${airdropId}`);
})();
