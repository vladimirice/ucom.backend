import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsUsersToWaitingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');

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

  it('test', async () => {
    // TODO - create mock for transactions sending
    // Process further status changing

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
function getSampleBlockchainPushResponse() {
  return {
    transaction_id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
    processed: {
      id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
      block_num: 40467685,
      block_time: '2019-04-09T16:27:38.000',
      producer_block_id: null,
      receipt: {
        status: 'executed',
        cpu_usage_us: 2310,
        net_usage_words: 17,
      },
      elapsed: 2310,
      net_usage: 136,
      scheduled: false,
      action_traces: [
        {
          receipt: {
            receiver: 'testairdrop1',
            act_digest: 'f0695b36f3b7c011266f21ff1ed80a6fc6cf6f8f89e378afe092fe13c5bbd197',
            global_sequence: 137495831,
            recv_sequence: 61,
            auth_sequence: [
              [
                'testairdrop1',
                120,
              ],
            ],
            code_sequence: 1,
            abi_sequence: 1,
          },
          act: {
            account: 'testairdrop1',
            name: 'send',
            authorization: [
              {
                actor: 'testairdrop1',
                permission: 'active',
              },
            ],
            data: {
              external_id: 3197937,
              airdrop_id: 12807513,
              amount: 30001,
              acc_name: 'jane',
              symbol: 'GHTEST',
            },
            hex_data: 'f1cb300000000000596dc3000000000031750000000000000000000000a0a67906474854455354',
          },
          context_free: false,
          elapsed: 1146,
          console: '4,GHTEST\n3.0001 GHTEST\n',
          trx_id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
          block_num: 40467685,
          block_time: '2019-04-09T16:27:38.000',
          producer_block_id: null,
          account_ram_deltas: [
            {
              account: 'testairdrop1',
              delta: 415,
            },
          ],
          except: null,
          inline_traces: [
            {
              receipt: {
                receiver: 'eosio.token',
                act_digest: 'e72d00220c47eab7af83dd8362675f56c7b4288a457d07bc1d26dd0ce8c8e6d8',
                global_sequence: 137495832,
                recv_sequence: 3382,
                auth_sequence: [
                  [
                    'testairdrop1',
                    121,
                  ],
                ],
                code_sequence: 2,
                abi_sequence: 2,
              },
              act: {
                account: 'eosio.token',
                name: 'transfer',
                authorization: [
                  {
                    actor: 'testairdrop1',
                    permission: 'active',
                  },
                ],
                data: {
                  from: 'testairdrop1',
                  to: 'jane',
                  quantity: '3.0001 GHTEST',
                  memo: 'airdrop',
                },
                hex_data: '102abde93a93b1ca0000000000a0a679317500000000000004474854455354000761697264726f70',
              },
              context_free: false,
              elapsed: 351,
              console: '',
              trx_id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
              block_num: 40467685,
              block_time: '2019-04-09T16:27:38.000',
              producer_block_id: null,
              account_ram_deltas: [],
              except: null,
              inline_traces: [
                {
                  receipt: {
                    receiver: 'testairdrop1',
                    act_digest: 'e72d00220c47eab7af83dd8362675f56c7b4288a457d07bc1d26dd0ce8c8e6d8',
                    global_sequence: 137495833,
                    recv_sequence: 62,
                    auth_sequence: [
                      [
                        'testairdrop1',
                        122,
                      ],
                    ],
                    code_sequence: 2,
                    abi_sequence: 2,
                  },
                  act: {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                      {
                        actor: 'testairdrop1',
                        permission: 'active',
                      },
                    ],
                    data: {
                      from: 'testairdrop1',
                      to: 'jane',
                      quantity: '3.0001 GHTEST',
                      memo: 'airdrop',
                    },
                    hex_data: '102abde93a93b1ca0000000000a0a679317500000000000004474854455354000761697264726f70',
                  },
                  context_free: false,
                  elapsed: 19,
                  console: '',
                  trx_id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
                  block_num: 40467685,
                  block_time: '2019-04-09T16:27:38.000',
                  producer_block_id: null,
                  account_ram_deltas: [],
                  except: null,
                  inline_traces: [],
                },
                {
                  receipt: {
                    receiver: 'jane',
                    act_digest: 'e72d00220c47eab7af83dd8362675f56c7b4288a457d07bc1d26dd0ce8c8e6d8',
                    global_sequence: 137495834,
                    recv_sequence: 72,
                    auth_sequence: [
                      [
                        'testairdrop1',
                        123,
                      ],
                    ],
                    code_sequence: 2,
                    abi_sequence: 2,
                  },
                  act: {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                      {
                        actor: 'testairdrop1',
                        permission: 'active',
                      },
                    ],
                    data: {
                      from: 'testairdrop1',
                      to: 'jane',
                      quantity: '3.0001 GHTEST',
                      memo: 'airdrop',
                    },
                    hex_data: '102abde93a93b1ca0000000000a0a679317500000000000004474854455354000761697264726f70',
                  },
                  context_free: false,
                  elapsed: 34,
                  console: '',
                  trx_id: 'e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e',
                  block_num: 40467685,
                  block_time: '2019-04-09T16:27:38.000',
                  producer_block_id: null,
                  account_ram_deltas: [],
                  except: null,
                  inline_traces: [],
                },
              ],
            },
          ],
        },
      ],
      except: null,
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
