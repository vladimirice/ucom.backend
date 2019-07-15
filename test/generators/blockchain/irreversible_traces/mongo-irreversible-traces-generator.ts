import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { UOS } from '../../../../lib/common/dictionary/symbols-dictionary';

import IrreversibleTracesClient   = require('../../../../lib/blockchain-traces/client/irreversible-traces-client');
import MongoExternalModelProvider = require('../../../../lib/eos/service/mongo-external-model-provider');
import BalancesHelper = require('../../../../lib/common/helper/blockchain/balances-helper');

const ACTION_TRACES_COLLECTION_NAME = MongoExternalModelProvider.actionTracesCollection();

let usedTracesSuffixes: number[] = [];

class MongoIrreversibleTracesGenerator {
  public static getSampleBlockProducers() {
    return [
      'adendumblock',
      'cryptolionsu',
    ];
  }

  public static getSampleStakeCpuQuantity(): number {
    return 2;
  }

  public static getSampleStakeNetQuantity(): number {
    return 3;
  }

  public static getSampleUnstakeCpuQuantity(): number {
    return 1;
  }

  public static getSampleUnstakeNetQuantity(): number {
    return 4;
  }

  public static getRamBytesToBuy(): number {
    return 100024;
  }

  public static getBuyRamBytesUos(): number {
    return 5.0486;
  }

  public static getBuyRamBytesUosFee(): number {
    return 0.0254;
  }

  public static getRamBytesToSell(): number {
    return 80001;
  }

  public static getSellRamBytesUos(): number {
    return 3.0156;
  }

  public static getSellRamBytesUosFee(): number {
    return 0.0182;
  }

  public static async insertAllSampleTraces(actor: UserModel, actsFor: UserModel) {
    usedTracesSuffixes = [];

    const collection =
      await IrreversibleTracesClient.useCollection(ACTION_TRACES_COLLECTION_NAME);

    const set = [
      // tokens transfer
      this.getSampleTransferTokensFromActorTrace,
      this.getSampleTransferTokensToActorTrace,

      // voting
      this.getSampleVoteForBpsTrace,
      this.getSampleRevokeAllVotesForBpsTrace,

      this.getSampleVoteForCalculatorsTrace,
      this.getSampleRevokeCalculatorVotes,

      this.getSampleClaimEmissionTrace,

      // Stake and unstake

      // stake only
      this.getSampleStakeCpuOnlyTrace,
      this.getSampleStakeNetOnlyTrace,
      this.getSampleStakeBothCpuAndNetTrace,

      // unstake only
      this.getSampleUnstakeCpuOnlyTrace,
      this.getSampleUnstakeNetOnlyTrace,
      this.getSampleUnstakeBothCpuAndNetTrace,

      // both stake and unstake
      this.getSampleStakeCpuAndUnstakeNetTrace,

      // RAM
      this.getSampleBuyRamTrace,
      this.getSampleSellRamTrace,

      // Unknown - future social one
      this.getSampleUpvoteTrace,

      this.getSampleTotallyMalformedTrace,
    ];

    for (const func of set) {
      const data = func(actor, actsFor);
      await collection.insertOne(data);
    }

    const foreignUser = {
      account_name: 'mvladimirice',
    };

    const toForeign = this.getSampleTransferTokensFromActorTrace(actor, <UserModel>foreignUser, 500);
    await collection.insertOne(toForeign);

    const fromForeign = this.getSampleTransferTokensFromActorTrace(<UserModel>foreignUser, actor, 501);
    await collection.insertOne(fromForeign);

    return {
      unique: set.length + 1,
    };
  }

  public static getSampleTransferTokensFromActorTrace(actor: UserModel, actsFor: UserModel, tracePrefix: number = 100) {
    const blockNumber = +`25330${tracePrefix}`;
    const trxId       = `7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b${tracePrefix}`;
    const blockId     = `0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c${tracePrefix}`;

    return {
      blocknum: blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio.token',
            act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
            global_sequence : 168542095,
            recv_sequence : 30650,
            auth_sequence : [
              [
                actor.account_name,
                229,
              ],
            ],
            code_sequence : 1,
            abi_sequence : 1,
          },
          act : {
            account : 'eosio.token',
            name : 'transfer',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
          },
          context_free : false,
          elapsed : 273,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:57:54.500',
          producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
          account_ram_deltas : [],
          act_data : {
            from : actor.account_name,
            to : actsFor.account_name,
            quantity : '10.0000 UOS',
            memo : 'hello there from 10 uos',
          },
          inline_traces : [
            {
              receipt : {
                receiver : actor.account_name,
                act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
                global_sequence : 168542096,
                recv_sequence : 59,
                auth_sequence : [
                  [
                    actor.account_name,
                    230,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
              },
              context_free : false,
              elapsed : 10,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:57:54.500',
              producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : actsFor.account_name,
                quantity : '10.0000 UOS',
                memo : 'hello there from 10 uos',
              },
              inline_traces : [],
            },
            {
              receipt : {
                receiver : actsFor.account_name,
                act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
                global_sequence : 168542097,
                recv_sequence : 21,
                auth_sequence : [
                  [
                    actor.account_name,
                    231,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
              },
              context_free : false,
              elapsed : 13,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:57:54.500',
              producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : actsFor.account_name,
                quantity : '10.0000 UOS',
                memo : 'hello there from 10 uos',
              },
              inline_traces : [],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T09:57:54.500',
    };
  }

  public static getSampleTransferTokensToActorTrace(actsFor: UserModel, actor: UserModel) {
    const blockNumber = 25330200;
    const trxId       = '7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b200';
    const blockId     = '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c200';

    return {
      blocknum: blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio.token',
            act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
            global_sequence : 168542095,
            recv_sequence : 30650,
            auth_sequence : [
              [
                actor.account_name,
                229,
              ],
            ],
            code_sequence : 1,
            abi_sequence : 1,
          },
          act : {
            account : 'eosio.token',
            name : 'transfer',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
          },
          context_free : false,
          elapsed : 273,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:57:54.500',
          producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
          account_ram_deltas : [],
          act_data : {
            from : actor.account_name,
            to : actsFor.account_name,
            quantity : '10.0000 UOS',
            memo : 'hello there from 10 uos',
          },
          inline_traces : [
            {
              receipt : {
                receiver : actor.account_name,
                act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
                global_sequence : 168542096,
                recv_sequence : 59,
                auth_sequence : [
                  [
                    actor.account_name,
                    230,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
              },
              context_free : false,
              elapsed : 10,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:57:54.500',
              producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : actsFor.account_name,
                quantity : '10.0000 UOS',
                memo : 'hello there from 10 uos',
              },
              inline_traces : [],
            },
            {
              receipt : {
                receiver : actsFor.account_name,
                act_digest : '8087e3e36a7c87fbefa9d5900b71aeaa99206aa89f39dfd59b718ddc9172b520',
                global_sequence : 168542097,
                recv_sequence : 21,
                auth_sequence : [
                  [
                    actor.account_name,
                    231,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6901b73134ea9b336a08601000000000004554f53000000001768656c6c6f2074686572652066726f6d20313020756f73',
              },
              context_free : false,
              elapsed : 13,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:57:54.500',
              producer_block_id : '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c195498051ce6',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : actsFor.account_name,
                quantity : '10.0000 UOS',
                memo : 'hello there from 10 uos',
              },
              inline_traces : [],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T09:57:54.500',
    };
  }

  public static getSampleRevokeCalculatorVotes(
    actor: UserModel,
    // @ts-ignore
    actsFor: UserModel,
  ) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(601);

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '4977267c3cc113906313fe90006f30e9b2fe95de1eb4693ff8a7efd248b133b5',
            global_sequence : 255570730,
            recv_sequence : 38581713,
            auth_sequence : [
              [
                actor.account_name,
                789,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'votecalc',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c600',
          },
          context_free : false,
          elapsed : 350,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-06-27T20:16:56.500',
          producer_block_id : '024c40e32c2d0e00a29d1c1a740c30476626f2cbd834f43e45cd732af498b255',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : -16,
            },
          ],
          act_data : {
            voter : actor.account_name,
            calculators : [],
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-06-27T20:16:56.500',
    };
  }


  public static getSampleVoteForCalculatorsTrace(
    actor: UserModel,
    // @ts-ignore
    actsFor: UserModel,
  ) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(600);

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'f9ccbfdb309222bd32c87e4f06584ee57fc83af4c90c4f235f845bc6d36fc7c6',
            global_sequence : 255564068,
            recv_sequence : 38580283,
            auth_sequence : [
              [
                actor.account_name,
                788,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'votecalc',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c602204408281a94dd74504608281a94dd74',
          },
          context_free : false,
          elapsed : 825,
          console : '',
          trx_id : '2ca2ca745c3231ea5a193f40602324a60c2a58c49da84e0ebfe0ce34393815fa',
          block_num : blockNumber,
          block_time : '2019-06-27T20:03:44.000',
          producer_block_id : '024c3b526f933b1f7a0fbc76cfd6f15040a4ad889e2987593c1d1abd8546ba16',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 16,
            },
          ],
          act_data : {
            voter : actor.account_name,
            calculators : MongoIrreversibleTracesGenerator.getCalculators(),
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-06-27T20:03:44.000',
    };
  }

  public static getCalculators(): string[] {
    return [
      'initcalc1122',
      'initcalc1135',
    ];
  }

  // @ts-ignore
  public static getSampleVoteForBpsTrace(actor: UserModel, actsFor: UserModel) {
    const blockNumber = 25330101;
    const trxId       = '7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b101';
    const blockId     = '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c101';

    const producers = MongoIrreversibleTracesGenerator.getSampleBlockProducers();

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '0b00c3e444df86b16e8c534434b327fe9f92f9aa95d41fa0cbb219ded1adf66e',
            global_sequence : 168542914,
            recv_sequence : 25345339,
            auth_sequence : [
              [
                actor.account_name,
                232,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'voteproducer',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c600000000000000000200118d47ea345532a0f1a42ed25cfd45',
          },
          context_free : false,
          elapsed : 3022,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:59:15.500',
          producer_block_id : '018282bd7bfdccf0dc703bc88bc8b19c17e5d50744c9836901465097a5adbc94',
          account_ram_deltas : [],
          act_data : {
            voter : actor.account_name,
            proxy : '',
            producers,
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T09:59:15.500',
    };
  }

  // @ts-ignore
  public static getSampleRevokeAllVotesForBpsTrace(actor: UserModel, actsFor: UserModel) {
    const blockNumber = 25330102;
    const blockId     = 'fb2c5048d6c33b6030a1955b7b788ec0fb2881be7c6999f168bad2698cd2b102';
    const trxId       = '0182830422a1de4ca431b2c14d983eaaa037bcb4334464ac29cbaf3fc578c102';

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'bbfbee4fb1f0916bcf2f0471dadbd9e0a28f71fe31ba337a550beed37588a142',
            global_sequence : 168542987,
            recv_sequence : 25345411,
            auth_sequence : [
              [
                actor.account_name,
                233,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'voteproducer',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6000000000000000000',
          },
          context_free : false,
          elapsed : 895,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:59:57.000',
          producer_block_id : '0182830422a1de4ca431b2c14d983eaaa037bcb4334464ac29cbaf3fc578f43a',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : -16,
            },
          ],
          act_data : {
            voter : actor.account_name,
            proxy : '',
            producers : [],
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T09:59:57.000',
    };
  }

  public static getSampleClaimEmissionTrace(
    actor: UserModel,
    // @ts-ignore
    actsFor: UserModel,
  ) {
    const { blockNumber, blockId, trxId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(103);

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'uos.calcs',
            act_digest : '9f66412e27d65d85565886eed4274349989315b3ea46e45ba01797f13a7bb334',
            global_sequence : 168476026,
            recv_sequence : 142839707,
            auth_sequence : [
              [
                actor.account_name,
                200,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 5,
          },
          act : {
            account : 'uos.calcs',
            name : 'withdrawal',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6',
          },
          context_free : false,
          elapsed : 327,
          console : 'hello1.334807300000004e+030.0000 UOS1334.8073 UOS',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T08:20:15.000',
          producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
          account_ram_deltas : [],
          act_data : {
            owner : actor.account_name,
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : 'ef005865965e2a0215767bae7c08368f616a4a92750552577c827ce8375eb797',
                global_sequence : 168476027,
                recv_sequence : 30624,
                auth_sequence : [
                  [
                    'eosio',
                    25350560,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'issue',
                authorization : [
                  {
                    actor : 'eosio',
                    permission : 'active',
                  },
                ],
                data : '0000c0281a0430d5e9accb000000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74',
              },
              context_free : false,
              elapsed : 440,
              console : '',
              trx_id : trxId,
              block_num: blockNumber,
              block_time : '2019-04-01T08:20:15.000',
              producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
              account_ram_deltas : [],
              act_data : {
                to : 'uos.calcs',
                quantity : '1334.8073 UOS',
                memo : 'issue tokens for account',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : 'eosio.token',
                    act_digest : '746d002254876db1e9a876653001a259f109809aa22f5131fcecdf54cc687a30',
                    global_sequence : 168476028,
                    recv_sequence : 30625,
                    auth_sequence : [
                      [
                        'eosio',
                        25350561,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : 'eosio',
                        permission : 'active',
                      },
                    ],
                    data : '0000000000ea30550000c0281a0430d5e9accb000000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74',
                  },
                  context_free : false,
                  elapsed : 161,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:20:15.000',
                  producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
                  account_ram_deltas : [],
                  act_data : {
                    from : 'eosio',
                    to : 'uos.calcs',
                    quantity : '1334.8073 UOS',
                    memo : 'issue tokens for account',
                  },
                  inline_traces : [
                    {
                      receipt : {
                        receiver : 'eosio',
                        act_digest : '746d002254876db1e9a876653001a259f109809aa22f5131fcecdf54cc687a30',
                        global_sequence : 168476029,
                        recv_sequence : 25334008,
                        auth_sequence : [
                          [
                            'eosio',
                            25350562,
                          ],
                        ],
                        code_sequence : 1,
                        abi_sequence : 1,
                      },
                      act : {
                        account : 'eosio.token',
                        name : 'transfer',
                        authorization : [
                          {
                            actor : 'eosio',
                            permission : 'active',
                          },
                        ],
                        data : '0000000000ea30550000c0281a0430d5e9accb000000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74',
                      },
                      context_free : false,
                      elapsed : 23,
                      console : '',
                      trx_id : trxId,
                      block_num : blockNumber,
                      block_time : '2019-04-01T08:20:15.000',
                      producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
                      account_ram_deltas : [],
                      act_data : {
                        from : 'eosio',
                        to : 'uos.calcs',
                        quantity : '1334.8073 UOS',
                        memo : 'issue tokens for account',
                      },
                      inline_traces : [],
                    },
                    {
                      receipt : {
                        receiver : 'uos.calcs',
                        act_digest : '746d002254876db1e9a876653001a259f109809aa22f5131fcecdf54cc687a30',
                        global_sequence : 168476030,
                        recv_sequence : 142839708,
                        auth_sequence : [
                          [
                            'eosio',
                            25350563,
                          ],
                        ],
                        code_sequence : 1,
                        abi_sequence : 1,
                      },
                      act : {
                        account : 'eosio.token',
                        name : 'transfer',
                        authorization : [
                          {
                            actor : 'eosio',
                            permission : 'active',
                          },
                        ],
                        data : '0000000000ea30550000c0281a0430d5e9accb000000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74',
                      },
                      context_free : false,
                      elapsed : 22,
                      console : '',
                      trx_id : trxId,
                      block_num : blockNumber,
                      block_time : '2019-04-01T08:20:15.000',
                      producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
                      account_ram_deltas : [],
                      act_data : {
                        from : 'eosio',
                        to : 'uos.calcs',
                        quantity : '1334.8073 UOS',
                        memo : 'issue tokens for account',
                      },
                      inline_traces : [],
                    },
                  ],
                },
              ],
            },
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : 'e3adad0dafdc17f14174f093f08eefe1492bc5898725c372a113a75bbb4afdc6',
                global_sequence : 168476031,
                recv_sequence : 30626,
                auth_sequence : [
                  [
                    'uos.calcs',
                    142797273,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : 'uos.calcs',
                    permission : 'active',
                  },
                ],
                data : '0000c0281a0430d5901b73135e25a5c6e9accb000000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74',
              },
              context_free : false,
              elapsed : 115,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T08:20:15.000',
              producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
              account_ram_deltas : [],
              act_data : {
                from : 'uos.calcs',
                to : actor.account_name,
                quantity : '1334.8073 UOS',
                memo : 'transfer issued tokens for account',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : 'uos.calcs',
                    act_digest : 'e3adad0dafdc17f14174f093f08eefe1492bc5898725c372a113a75bbb4afdc6',
                    global_sequence : 168476032,
                    recv_sequence : 142839709,
                    auth_sequence : [
                      [
                        'uos.calcs',
                        142797274,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : 'uos.calcs',
                        permission : 'active',
                      },
                    ],
                    data : '0000c0281a0430d5901b73135e25a5c6e9accb000000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74',
                  },
                  context_free : false,
                  elapsed : 17,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:20:15.000',
                  producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
                  account_ram_deltas : [],
                  act_data : {
                    from : 'uos.calcs',
                    to : actor.account_name,
                    quantity : '1334.8073 UOS',
                    memo : 'transfer issued tokens for account',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : 'e3adad0dafdc17f14174f093f08eefe1492bc5898725c372a113a75bbb4afdc6',
                    global_sequence : 168476033,
                    recv_sequence : 51,
                    auth_sequence : [
                      [
                        'uos.calcs',
                        142797275,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : 'uos.calcs',
                        permission : 'active',
                      },
                    ],
                    data : '0000c0281a0430d5901b73135e25a5c6e9accb000000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74',
                  },
                  context_free : false,
                  elapsed : 8,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:20:15.000',
                  producer_block_id : '0182568aadc00cdf88f5fd5e1ea2a091344af2eb62756b2f323237c718443410',
                  account_ram_deltas : [],
                  act_data : {
                    from : 'uos.calcs',
                    to : actor.account_name,
                    quantity : '1334.8073 UOS',
                    memo : 'transfer issued tokens for account',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T08:20:15.000',
    };
  }

  public static getSampleBuyRamTrace(
    actor: UserModel,
    // @ts-ignore
    actsFor: UserModel,
  ) {
    const { blockNumber, blockId, trxId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(104);

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'c308045a28c75551c3a3909b0ac03a2d2d30378529efe28f53dcba47c5758a88',
            global_sequence : 168479102,
            recv_sequence : 25334761,
            auth_sequence : [
              [
                actor.account_name,
                201,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'buyrambytes',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6b8860100',
          },
          context_free : false,
          elapsed : 765,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T08:26:49.500',
          producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
          account_ram_deltas : [],
          act_data : {
            payer : actor.account_name,
            receiver : actor.account_name,
            bytes : MongoIrreversibleTracesGenerator.getRamBytesToBuy(),
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : 'd8ab02eef227d40f0664b22c6cd8e9e0a9b0cdf86d525ee9637f0edc70621508',
                global_sequence : 168479103,
                recv_sequence : 30627,
                auth_sequence : [
                  [
                    actor.account_name,
                    202,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6000090e602ea305536c500000000000004554f5300000000076275792072616d',
              },
              context_free : false,
              elapsed : 199,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T08:26:49.500',
              producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.ram',
                quantity : `${MongoIrreversibleTracesGenerator.getBuyRamBytesUos()} UOS`,
                memo : 'buy ram',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : 'd8ab02eef227d40f0664b22c6cd8e9e0a9b0cdf86d525ee9637f0edc70621508',
                    global_sequence : 168479104,
                    recv_sequence : 52,
                    auth_sequence : [
                      [
                        actor.account_name,
                        203,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6000090e602ea305536c500000000000004554f5300000000076275792072616d',
                  },
                  context_free : false,
                  elapsed : 6,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:26:49.500',
                  producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ram',
                    quantity : '5.0486 UOS',
                    memo : 'buy ram',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.ram',
                    act_digest : 'd8ab02eef227d40f0664b22c6cd8e9e0a9b0cdf86d525ee9637f0edc70621508',
                    global_sequence : 168479105,
                    recv_sequence : 1576,
                    auth_sequence : [
                      [
                        actor.account_name,
                        204,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6000090e602ea305536c500000000000004554f5300000000076275792072616d',
                  },
                  context_free : false,
                  elapsed : 7,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:26:49.500',
                  producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ram',
                    quantity : '5.0486 UOS',
                    memo : 'buy ram',
                  },
                  inline_traces : [],
                },
              ],
            },
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : '7a15554802bf85a3dfca202e55978e2d90353d63601b38086861616ca4043d40',
                global_sequence : 168479106,
                recv_sequence : 30628,
                auth_sequence : [
                  [
                    actor.account_name,
                    205,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000772616d20666565',
              },
              context_free : false,
              elapsed : 182,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T08:26:49.500',
              producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.ramfee',
                quantity : `${MongoIrreversibleTracesGenerator.getBuyRamBytesUosFee()} UOS`,
                memo : 'ram fee',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : '7a15554802bf85a3dfca202e55978e2d90353d63601b38086861616ca4043d40',
                    global_sequence : 168479107,
                    recv_sequence : 53,
                    auth_sequence : [
                      [
                        actor.account_name,
                        206,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000772616d20666565',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:26:49.500',
                  producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ramfee',
                    quantity : '0.0254 UOS',
                    memo : 'ram fee',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.ramfee',
                    act_digest : '7a15554802bf85a3dfca202e55978e2d90353d63601b38086861616ca4043d40',
                    global_sequence : 168479108,
                    recv_sequence : 1576,
                    auth_sequence : [
                      [
                        actor.account_name,
                        207,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000772616d20666565',
                  },
                  context_free : false,
                  elapsed : 6,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:26:49.500',
                  producer_block_id : '0182597a9615b1d59257cc003eabe739ea3f9acfa66b6d8f6d69fa018d57b181',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ramfee',
                    quantity : '0.0254 UOS',
                    memo : 'ram fee',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T08:26:49.500',
    };
  }

  // @ts-ignore
  public static getSampleSellRamTrace(actor: UserModel, actsFor: UserModel) {
    const blockNumber = 25330105;
    const blockId     = 'fb2c5048d6c33b6030a1955b7b788ec0fb2881be7c6999f168bad2698cd2b105';
    const trxId       = '0182830422a1de4ca431b2c14d983eaaa037bcb4334464ac29cbaf3fc578c105';

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '0bb55948254066416f40b43f5d37d8e86c1934754ca62573190383076d3ba402',
            global_sequence : 168482079,
            recv_sequence : 25335185,
            auth_sequence : [
              [
                actor.account_name,
                208,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'sellram',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6a186010000000000',
          },
          context_free : false,
          elapsed : 752,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T08:30:33.000',
          producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
          account_ram_deltas : [],
          act_data : {
            account : actor.account_name,
            bytes : MongoIrreversibleTracesGenerator.getRamBytesToSell(),
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : '53867ef7ab389af51c4883583c2e6638eee326aec050c3153c12c0f20f1e9cb6',
                global_sequence : 168482080,
                recv_sequence : 30629,
                auth_sequence : [
                  [
                    'eosio.ram',
                    115,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : 'eosio.ram',
                    permission : 'active',
                  },
                ],
                data : '000090e602ea3055901b73135e25a5c629c600000000000004554f53000000000873656c6c2072616d',
              },
              context_free : false,
              elapsed : 227,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T08:30:33.000',
              producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
              account_ram_deltas : [],
              act_data : {
                from : 'eosio.ram',
                to : actor.account_name,
                quantity : `${MongoIrreversibleTracesGenerator.getSellRamBytesUos()} UOS`,
                memo : 'sell ram',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : 'eosio.ram',
                    act_digest : '53867ef7ab389af51c4883583c2e6638eee326aec050c3153c12c0f20f1e9cb6',
                    global_sequence : 168482081,
                    recv_sequence : 1577,
                    auth_sequence : [
                      [
                        'eosio.ram',
                        116,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : 'eosio.ram',
                        permission : 'active',
                      },
                    ],
                    data : '000090e602ea3055901b73135e25a5c629c600000000000004554f53000000000873656c6c2072616d',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:30:33.000',
                  producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
                  account_ram_deltas : [],
                  act_data : {
                    from : 'eosio.ram',
                    to : actor.account_name,
                    quantity : '5.0729 UOS',
                    memo : 'sell ram',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : '53867ef7ab389af51c4883583c2e6638eee326aec050c3153c12c0f20f1e9cb6',
                    global_sequence : 168482082,
                    recv_sequence : 54,
                    auth_sequence : [
                      [
                        'eosio.ram',
                        117,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : 'eosio.ram',
                        permission : 'active',
                      },
                    ],
                    data : '000090e602ea3055901b73135e25a5c629c600000000000004554f53000000000873656c6c2072616d',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:30:33.000',
                  producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
                  account_ram_deltas : [],
                  act_data : {
                    from : 'eosio.ram',
                    to : actor.account_name,
                    quantity : '5.0729 UOS',
                    memo : 'sell ram',
                  },
                  inline_traces : [],
                },
              ],
            },
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : '73fe6765aeb4432836cf86631b89f57c31b505600bdf9ca4e5bb6ced10880963',
                global_sequence : 168482083,
                recv_sequence : 30630,
                auth_sequence : [
                  [
                    actor.account_name,
                    209,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000c73656c6c2072616d20666565',
              },
              context_free : false,
              elapsed : 181,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T08:30:33.000',
              producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.ramfee',
                quantity : `${MongoIrreversibleTracesGenerator.getSellRamBytesUosFee()} UOS`,
                memo : 'sell ram fee',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : '73fe6765aeb4432836cf86631b89f57c31b505600bdf9ca4e5bb6ced10880963',
                    global_sequence : 168482084,
                    recv_sequence : 55,
                    auth_sequence : [
                      [
                        actor.account_name,
                        210,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000c73656c6c2072616d20666565',
                  },
                  context_free : false,
                  elapsed : 4,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:30:33.000',
                  producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ramfee',
                    quantity : '0.0254 UOS',
                    memo : 'sell ram fee',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.ramfee',
                    act_digest : '73fe6765aeb4432836cf86631b89f57c31b505600bdf9ca4e5bb6ced10880963',
                    global_sequence : 168482085,
                    recv_sequence : 1577,
                    auth_sequence : [
                      [
                        actor.account_name,
                        211,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c6a0d492e602ea3055fe0000000000000004554f53000000000c73656c6c2072616d20666565',
                  },
                  context_free : false,
                  elapsed : 6,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T08:30:33.000',
                  producer_block_id : '01825b2101cb8ba20de416bea5adbe312729d27d044d8a428099f0a45f80ca6a',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.ramfee',
                    quantity : '0.0254 UOS',
                    memo : 'sell ram fee',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T08:30:33.000',
    };
  }

  // @ts-ignore
  public static getSampleStakeCpuOnlyTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(106);

    const stake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(0, UOS);
    const stake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '02611e5993ea5cc47b5354e2fda0aebef4ab3a2cf764b734f5fc049883b31781',
            global_sequence : 168508568,
            recv_sequence : 25339912,
            auth_sequence : [
              [
                actor.account_name,
                212,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'delegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6000000000000000004554f5300000000204e00000000000004554f530000000000',
          },
          context_free : false,
          elapsed : 1174,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:11:56.500',
          producer_block_id : '01826d97d4ade0bc87603b5a3e9f50567bf91185c5bf8733fa7da8de59f98c79',
          account_ram_deltas : [],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            stake_net_quantity,
            stake_cpu_quantity,
            transfer : 0,
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : '571ec26a2bfdb3b2f0c53b8640049390808020738fc457171f07e15422db7812',
                global_sequence : 168508569,
                recv_sequence : 30631,
                auth_sequence : [
                  [
                    actor.account_name,
                    213,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c60014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468',
              },
              context_free : false,
              elapsed : 225,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:11:56.500',
              producer_block_id : '01826d97d4ade0bc87603b5a3e9f50567bf91185c5bf8733fa7da8de59f98c79',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.stake',
                quantity : stake_cpu_quantity,
                memo : 'stake bandwidth',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : '571ec26a2bfdb3b2f0c53b8640049390808020738fc457171f07e15422db7812',
                    global_sequence : 168508570,
                    recv_sequence : 56,
                    auth_sequence : [
                      [
                        actor.account_name,
                        214,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 6,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T09:11:56.500',
                  producer_block_id : '01826d97d4ade0bc87603b5a3e9f50567bf91185c5bf8733fa7da8de59f98c79',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : stake_cpu_quantity,
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.stake',
                    act_digest : '571ec26a2bfdb3b2f0c53b8640049390808020738fc457171f07e15422db7812',
                    global_sequence : 168508571,
                    recv_sequence : 2805,
                    auth_sequence : [
                      [
                        actor.account_name,
                        215,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 7,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T09:11:56.500',
                  producer_block_id : '01826d97d4ade0bc87603b5a3e9f50567bf91185c5bf8733fa7da8de59f98c79',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : stake_cpu_quantity,
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T09:11:56.500',
    };
  }

  // @ts-ignore
  public static getSampleStakeBothCpuAndNetTrace(actor: UserModel, actsFor: UserModel) {
    const blockNumber = 25330107;
    const trxId       = '7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b107';
    const blockId     = '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c107';


    const stake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity(),
      UOS,
    );
    const stake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleStakeNetQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '181ddbdb089e6ce627ab5d633ae5e9e976d575b69bbaba502867db55c70c5bd1',
            global_sequence : 168514065,
            recv_sequence : 25340770,
            auth_sequence : [
              [
                actor.account_name,
                217,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'delegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6204e00000000000004554f5300000000000000000000000004554f530000000000',
          },
          context_free : false,
          elapsed : 1311,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:19:22.500',
          producer_block_id : '018270ef588618997593f73745a27f992d3f5270e191bfcf8393ea4bab49dd4d',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : -600,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            stake_net_quantity,
            stake_cpu_quantity : '0.0000 UOS',
            transfer : 0,
          },
          inline_traces : [],
        },
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'c597b00aa436e8e80933b9f909ca8045d3395c6544d809b0b885692725fe4c93',
            global_sequence : 168514066,
            recv_sequence : 25340771,
            auth_sequence : [
              [
                actor.account_name,
                218,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'delegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6000000000000000004554f5300000000307500000000000004554f530000000000',
          },
          context_free : false,
          elapsed : 1086,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:19:22.500',
          producer_block_id : '018270ef588618997593f73745a27f992d3f5270e191bfcf8393ea4bab49dd4d',
          account_ram_deltas : [],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            stake_net_quantity : '0.0000 UOS',
            stake_cpu_quantity,
            transfer : 0,
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                global_sequence : 168514067,
                recv_sequence : 30632,
                auth_sequence : [
                  [
                    actor.account_name,
                    219,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
              },
              context_free : false,
              elapsed : 252,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:19:22.500',
              producer_block_id : '018270ef588618997593f73745a27f992d3f5270e191bfcf8393ea4bab49dd4d',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.stake',
                quantity : '3.0000 UOS',
                memo : 'stake bandwidth',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                    global_sequence : 168514068,
                    recv_sequence : 57,
                    auth_sequence : [
                      [
                        actor.account_name,
                        220,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T09:19:22.500',
                  producer_block_id : '018270ef588618997593f73745a27f992d3f5270e191bfcf8393ea4bab49dd4d',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : '3.0000 UOS',
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.stake',
                    act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                    global_sequence : 168514069,
                    recv_sequence : 2806,
                    auth_sequence : [
                      [
                        actor.account_name,
                        221,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 44,
                  console : '',
                  trx_id : trxId,
                  block_num : blockNumber,
                  block_time : '2019-04-01T09:19:22.500',
                  producer_block_id : '018270ef588618997593f73745a27f992d3f5270e191bfcf8393ea4bab49dd4d',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : '3.0000 UOS',
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T09:19:22.500',
    };
  }

  // @ts-ignore
  public static getSampleStakeNetOnlyTrace(actor: UserModel, actsFor: UserModel) {
    const blockNumber = 25330108;
    const trxId       = '7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b108';
    const blockId     = '0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c108';

    const stake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(0, UOS);
    const stake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleStakeNetQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '5e4bb4bf6ae8e80f328d07f1091fb89ad4d769189f1243892d5d8fc499e0f1fe',
            global_sequence : 168516060,
            recv_sequence : 25340955,
            auth_sequence : [
              [
                actor.account_name,
                222,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'delegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6307500000000000004554f5300000000000000000000000004554f530000000000',
          },
          context_free : false,
          elapsed : 753,
          console : '',
          trx_id : trxId,
          block_num : blockNumber,
          block_time : '2019-04-01T09:20:59.500',
          producer_block_id : '018271a55b60d1c7094860c055cc665f631f13ac9daf5029269f271c3c173d41',
          account_ram_deltas : [],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            stake_net_quantity,
            stake_cpu_quantity,
            transfer : 0,
          },
          inline_traces : [
            {
              receipt : {
                receiver : 'eosio.token',
                act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                global_sequence : 168516061,
                recv_sequence : 30636,
                auth_sequence : [
                  [
                    actor.account_name,
                    223,
                  ],
                ],
                code_sequence : 1,
                abi_sequence : 1,
              },
              act : {
                account : 'eosio.token',
                name : 'transfer',
                authorization : [
                  {
                    actor : actor.account_name,
                    permission : 'active',
                  },
                ],
                data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
              },
              context_free : false,
              elapsed : 146,
              console : '',
              trx_id : trxId,
              block_num : blockNumber,
              block_time : '2019-04-01T09:20:59.500',
              producer_block_id : '018271a55b60d1c7094860c055cc665f631f13ac9daf5029269f271c3c173d41',
              account_ram_deltas : [],
              act_data : {
                from : actor.account_name,
                to : 'eosio.stake',
                quantity : stake_net_quantity,
                memo : 'stake bandwidth',
              },
              inline_traces : [
                {
                  receipt : {
                    receiver : actor.account_name,
                    act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                    global_sequence : 168516062,
                    recv_sequence : 58,
                    auth_sequence : [
                      [
                        actor.account_name,
                        224,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num: blockNumber,
                  block_time : '2019-04-01T09:20:59.500',
                  producer_block_id : '018271a55b60d1c7094860c055cc665f631f13ac9daf5029269f271c3c173d41',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : stake_net_quantity,
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
                {
                  receipt : {
                    receiver : 'eosio.stake',
                    act_digest : 'dc71c3021123f8fa67e5354b9e268b4c7230245e10e9f0b528571f486128603f',
                    global_sequence : 168516063,
                    recv_sequence : 2807,
                    auth_sequence : [
                      [
                        actor.account_name,
                        225,
                      ],
                    ],
                    code_sequence : 1,
                    abi_sequence : 1,
                  },
                  act : {
                    account : 'eosio.token',
                    name : 'transfer',
                    authorization : [
                      {
                        actor : actor.account_name,
                        permission : 'active',
                      },
                    ],
                    data : '901b73135e25a5c60014341903ea3055307500000000000004554f53000000000f7374616b652062616e647769647468',
                  },
                  context_free : false,
                  elapsed : 5,
                  console : '',
                  trx_id : trxId,
                  block_num: blockNumber,
                  block_time : '2019-04-01T09:20:59.500',
                  producer_block_id : '018271a55b60d1c7094860c055cc665f631f13ac9daf5029269f271c3c173d41',
                  account_ram_deltas : [],
                  act_data : {
                    from : actor.account_name,
                    to : 'eosio.stake',
                    quantity : stake_net_quantity,
                    memo : 'stake bandwidth',
                  },
                  inline_traces : [],
                },
              ],
            },
          ],
        },
      ],
      blocktime : '2019-04-01T09:20:59.500',
    };
  }

  // @ts-ignore
  public static getSampleUnstakeCpuOnlyTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(109);

    const unstake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleUnstakeCpuQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '780850ef450265642f1202eb62996df90d51c310667766f4fea62da9ded55650',
            global_sequence : 168539459,
            recv_sequence : 25344861,
            auth_sequence : [
              [
                actor.account_name,
                226,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'undelegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6000000000000000004554f5300000000307500000000000004554f5300000000',
          },
          context_free : false,
          elapsed : 861,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T09:55:06.000',
          producer_block_id : '018280e20aff8512af97e90e4ab7425efe21e14408d23660647a2fa24461792e',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 600,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            unstake_net_quantity : '0.0000 UOS',
            unstake_cpu_quantity,
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T09:55:06.000',
    };
  }

  // @ts-ignore
  public static getSampleUnstakeNetOnlyTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(110);

    const unstake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'c681c454bdaaa8e17ad46876ade047db83436490e640276d35ef6792f1fa7afd',
            global_sequence : 168508717,
            recv_sequence : 25340058,
            auth_sequence : [
              [
                actor.account_name,
                216,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'undelegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6204e00000000000004554f5300000000000000000000000004554f5300000000',
          },
          context_free : false,
          elapsed : 1980,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T09:13:09.000',
          producer_block_id : '01826e286c1d95592b7e45217c3f0a8393f5bf49fa8511fd3085a9ea493560e3',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 600,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            unstake_net_quantity,
            unstake_cpu_quantity: '0.0000 UOS',
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T09:13:09.000',
    };
  }

  // @ts-ignore
  public static getSampleUnstakeBothCpuAndNetTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(111);

    const unstake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity(),
      UOS,
    );

    const unstake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleUnstakeCpuQuantity(),
      UOS,
    );


    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'fab0054aa992fe0ea2bf61f036de88bd0838bd515e0de5a3bddcc3f44e65f829',
            global_sequence : 168540046,
            recv_sequence : 25344988,
            auth_sequence : [
              [
                actor.account_name,
                227,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'undelegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6102700000000000004554f5300000000000000000000000004554f5300000000',
          },
          context_free : false,
          elapsed : 1374,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T09:56:15.000',
          producer_block_id : '018281606fe89d2fd45bb963a58acf0cdf31914a074110dfff9c7c119fe6e889',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 0,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            unstake_net_quantity,
            unstake_cpu_quantity : '0.0000 UOS',
          },
          inline_traces : [],
        },
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '127fa5396dec621da62b84fd19607a8ba300401889039baa37688bb084843d74',
            global_sequence : 168540047,
            recv_sequence : 25344989,
            auth_sequence : [
              [
                actor.account_name,
                228,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'undelegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6000000000000000004554f5300000000409c00000000000004554f5300000000',
          },
          context_free : false,
          elapsed : 1172,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T09:56:15.000',
          producer_block_id : '018281606fe89d2fd45bb963a58acf0cdf31914a074110dfff9c7c119fe6e889',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 0,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            unstake_net_quantity : '0.0000 UOS',
            unstake_cpu_quantity,
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T09:56:15.000',
    };
  }

  // @ts-ignore
  public static getSampleStakeCpuAndUnstakeNetTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(112);

    const unstake_net_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity(),
      UOS,
    );

    const stake_cpu_quantity: string = BalancesHelper.getTokensMajorOnlyAmountAsString(
      MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity(),
      UOS,
    );

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'eosio',
            act_digest : '045f702adb1a02587940ab22a291538241f1c766027df94483caf2ca1c06a555',
            global_sequence : 168553185,
            recv_sequence : 25347032,
            auth_sequence : [
              [
                actor.account_name,
                235,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'undelegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6307500000000000004554f5300000000000000000000000004554f5300000000',
          },
          context_free : false,
          elapsed : 846,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T10:13:59.500',
          producer_block_id : '01828951a5829aab6c71bd165b6e5572cf796613d9254b9f488a7d6fbbd3faba',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 0,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            unstake_net_quantity,
            unstake_cpu_quantity : '0.0000 UOS',
          },
          inline_traces : [],
        },
        {
          receipt : {
            receiver : 'eosio',
            act_digest : 'c597b00aa436e8e80933b9f909ca8045d3395c6544d809b0b885692725fe4c93',
            global_sequence : 168553186,
            recv_sequence : 25347033,
            auth_sequence : [
              [
                actor.account_name,
                236,
              ],
            ],
            code_sequence : 4,
            abi_sequence : 4,
          },
          act : {
            account : 'eosio',
            name : 'delegatebw',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c6901b73135e25a5c6000000000000000004554f5300000000307500000000000004554f530000000000',
          },
          context_free : false,
          elapsed : 676,
          console : '',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T10:13:59.500',
          producer_block_id : '01828951a5829aab6c71bd165b6e5572cf796613d9254b9f488a7d6fbbd3faba',
          account_ram_deltas : [
            {
              account : actor.account_name,
              delta : 0,
            },
          ],
          act_data : {
            from : actor.account_name,
            receiver : actor.account_name,
            stake_net_quantity : '0.0000 UOS',
            stake_cpu_quantity,
            transfer : 0,
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T10:13:59.500',
    };
  }

  // @ts-ignore
  public static getSampleUpvoteTrace(actor: UserModel, actsFor: UserModel) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(713);

    return {
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          receipt : {
            receiver : 'uos.activity',
            act_digest : '48c02162575a559daa944accdc465cddf49b6d14aa9eed103cd527a58f0b6106',
            global_sequence : 168545465,
            recv_sequence : 237022,
            auth_sequence : [
              [
                actor.account_name,
                234,
              ],
            ],
            code_sequence : 3,
            abi_sequence : 3,
          },
          act : {
            account : 'uos.activity',
            name : 'usertocont',
            authorization : [
              {
                actor : actor.account_name,
                permission : 'active',
              },
            ],
            data : '901b73135e25a5c61670737464722d7875626a76656a686a74387261797a3104',
          },
          context_free : false,
          elapsed : 141,
          console : 'usertocont acc = summerknight content_id = pstdr-xubjvejhjt8rayz1 interaction_type_id = 4',
          trx_id : trxId,
          block_num: blockNumber,
          block_time : '2019-04-01T10:04:14.000',
          producer_block_id : '018284ee32b197ea7a91171948fd24ab66f321c01f1bb54e03719fb0a37c2ac7',
          account_ram_deltas : [],
          act_data : {
            acc : actor.account_name,
            content_id : 'pstdr-xubjvejhjt8rayz1',
            interaction_type_id : 2,
          },
          inline_traces : [],
        },
      ],
      blocktime : '2019-04-01T10:04:14.000',
    };
  }


  public static getSampleTotallyMalformedTrace(
    actor: UserModel,
    // @ts-ignore
    actsFor: UserModel,
  ) {
    const { blockNumber, trxId, blockId } = MongoIrreversibleTracesGenerator.getTraceIdsAndNumbersWithSuffix(700);

    return {
      malformed: true,
      blocknum : blockNumber,
      blockid : blockId,
      trxid : trxId,
      account : actor.account_name,
      irreversible : true,
      actions : [
        {
          malformed: true,
        },
      ],
      blocktime : '2019-04-01T10:04:14.000',
    };
  }

  private static getTraceIdsAndNumbersWithSuffix(suffix: number): { blockNumber: number, trxId: string, blockId: string } {
    if (usedTracesSuffixes.includes(suffix)) {
      throw new TypeError(`Suffix ${suffix} is already used. Consider to use the different one`);
    }

    usedTracesSuffixes.push(suffix);

    return {
      blockNumber: +`25330${suffix}`,
      trxId:        `7cb3e80e1b83ee326a71d6285aebb7b8a8db97ecba7213057966c7a18844b${suffix}`,
      blockId:      `0182821bfd8f32c8ec8652c51f56d9538ba0d858b4130f961b6c19549805c${suffix}`,
    };
  }
}

export = MongoIrreversibleTracesGenerator;
