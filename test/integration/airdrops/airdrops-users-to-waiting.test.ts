import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsUsersToWaitingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
// @ts-ignore
import MockHelper = require('../helpers/mock-helper');

const { WalletApi } = require('ucom-libs-wallet');

// @ts-ignore
let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;

describe('Airdrops users to pending', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  it('process two pending users', async () => {
    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    WalletApi.setNodeJsEnv();
    WalletApi.initForStagingEnv();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    // @ts-ignore
    const userVladData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
    // @ts-ignore
    const userJaneData =
      await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, true);
    await AirdropsUsersToPendingService.process(airdropId);

    const limit = 100;
    await AirdropsUsersToWaitingService.process(limit);

    /*
      TODO
      if already waiting - do not fetch it
      if nobody is pending - process nothing

      check that related reserves accounts are empty
      check that related waiting accounts are fulled by required amounts

      check pagination - run twice, set pagination from outside as parameter
     */
  }, JEST_TIMEOUT * 100);
});


// @ts-ignore
function getSampleSignedTrx() {
  return {
    signatures: [
      'SIG_K1_KWk6eceRGtAHmoNgQQ6NfgejCiGX2dpCwQbB2GqokX1WyM9XcTctDPqQeAUUUU3Am3XQPxkCG7ACgbFhJZJMDoHBHRD9LL',
    ],
    serializedTransaction: {
      0: 101,
      1: 198,
      2: 172,
      3: 92,
      4: 127,
      5: 121,
      6: 41,
      7: 102,
      8: 3,
      9: 115,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 1,
      15: 16,
      16: 42,
      17: 189,
      18: 233,
      19: 58,
      20: 147,
      21: 177,
      22: 202,
      23: 0,
      24: 0,
      25: 0,
      26: 0,
      27: 0,
      28: 144,
      29: 166,
      30: 194,
      31: 1,
      32: 16,
      33: 42,
      34: 189,
      35: 233,
      36: 58,
      37: 147,
      38: 177,
      39: 202,
      40: 0,
      41: 0,
      42: 0,
      43: 0,
      44: 168,
      45: 237,
      46: 50,
      47: 50,
      48: 39,
      49: 4,
      50: 0,
      51: 0,
      52: 0,
      53: 0,
      54: 0,
      55: 0,
      56: 0,
      57: 41,
      58: 0,
      59: 0,
      60: 0,
      61: 0,
      62: 0,
      63: 0,
      64: 0,
      65: 112,
      66: 33,
      67: 40,
      68: 0,
      69: 0,
      70: 0,
      71: 0,
      72: 0,
      73: 160,
      74: 166,
      75: 121,
      76: 106,
      77: 154,
      78: 167,
      79: 166,
      80: 121,
      81: 6,
      82: 71,
      83: 72,
      84: 84,
      85: 69,
      86: 83,
      87: 84,
      88: 0,
    },
  };
}

// @ts-ignore
function getBlockchainPushErrorContent() {
  return {
    json: {
      code: 500,
      message: 'Internal Service Error',
      error: {
        code: 3050003,
        name: 'eosio_assert_message_exception',
        what: 'eosio_assert_message assertion failure',
        details: [],
      },
    },
    message: 'Internal Service Error',
    stack: 'Error: Internal Service Error\n' +
      '    at new RpcError (/home/vlad/Projects/ucom/ucom',
  };
}

export {};
