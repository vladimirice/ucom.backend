/* tslint:disable:max-line-length */
import { CommentsCreatorService } from '../../../lib/comments/service/comments-creator-service';
import {
  AirdropsReceiptTableRowsDto,
  AirdropsUserToChangeStatusDto,
} from '../../../lib/airdrops/interfaces/dto-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { UosAccountPropertiesDto, UosAccountsResponseDto } from '../../../lib/uos-accounts-properties/interfaces/model-interfaces';

import AirdropsTransactionsSender = require('../../../lib/airdrops/service/blockchain/airdrops-transactions-sender');
import AirdropsFetchTableRowsService = require('../../../lib/airdrops/service/blockchain/airdrops-fetch-table-rows-service');
import NumbersHelper = require('../../../lib/common/helper/numbers-helper');
import ImportanceGenerator = require('../../generators/blockchain/importance/uos-accounts-properties-generator');
import UosAccountsPropertiesFetchService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-fetch-service');
import EosApi = require('../../../lib/eos/eosApi');
import EosPostsInputProcessor = require('../../../lib/eos/input-processor/content/eos-posts-input-processor');

// @ts-ignore
const uniqid = require('uniqid');

const userActivityService = require('../../../lib/users/user-activity-service');
const organizationService = require('../../../lib/organizations/service/organization-service');
const usersToOrgActivity = require('../../../lib/users/activity/user-to-organization-activity');
const activityProducer = require('../../../lib/jobs/activity-producer');

const eosTransactionService = require('../../../lib/eos/eos-transaction-service');

let orgCounter = 1;
let postCreationCounter = 1;

class MockHelper {
  public static mockUosAccountsPropertiesFetchService(
    firstUser: UserModel,
    secondUser: UserModel,
    thirdUser: UserModel,
    fourthUser: UserModel,
  ) {
    const sampleData: UosAccountPropertiesDto[]
      = ImportanceGenerator.getSampleProperties(
        firstUser.account_name,
        secondUser.account_name,
        thirdUser.account_name,
        fourthUser.account_name,
      );

    UosAccountsPropertiesFetchService.getData = async (
      lowerBound: number,
      limit: number,
    ): Promise<UosAccountsResponseDto> => {
      const accounts: UosAccountPropertiesDto[] = [];

      for (let i = lowerBound; i < lowerBound + limit; i += 1) {
        if (!sampleData[i]) {
          break;
        }

        accounts.push(sampleData[i]);
      }

      return {
        limit,
        lower_bound: lowerBound,
        total: sampleData.length,
        accounts,
      };
    };
  }

  public static mockAirdropsTransactionsSenderForSuccess() {
    AirdropsTransactionsSender.sendTransaction = async (
      // @ts-ignore
      item: AirdropsUserToChangeStatusDto,
    ): Promise<{signedPayload: any, pushingResponse: any}> => {
      const signedPayload = {
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

      const pushingResponse = {
        transaction_id: `e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e${uniqid()}`,
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

      return {
        signedPayload,
        pushingResponse,
      };
    };
  }

  public static mockGetAirdropsReceiptTableRowsAfterExternalId(toMock: any[] = []) {
    AirdropsFetchTableRowsService.getAirdropsReceiptTableRowsAfterExternalId = async (
      // @ts-ignore
      externalId: number,
    ): Promise<AirdropsReceiptTableRowsDto[]> => {
      const res: AirdropsReceiptTableRowsDto[] = [];

      res.push({
        id: 994,
        external_id: 100500,
        airdrop_id: 12,
        amount: 830000,
        acc_name: 'omgomgomgomg',
        symbol: 'UOSTEST',
      });

      for (const mock of toMock) {
        if (!mock.waiting || +mock.waiting.current_balance === 0) {
          throw new Error('Malformed mock');
        }

        res.push({
          external_id: +mock.id,
          amount: +mock.waiting.current_balance,
          acc_name: mock.account_name,
          symbol: mock.symbol_title,

          id: NumbersHelper.generateRandomInteger(0, 100),
          airdrop_id: NumbersHelper.generateRandomInteger(0, 100),
        });
      }

      res.push({
        id: 623,
        external_id: 2321,
        airdrop_id: 13,
        amount: 430000,
        acc_name: 'omgomgomgomg',
        symbol: 'GHTEST',
      });

      res.push({
        id: 641,
        external_id: 324,
        airdrop_id: 12,
        amount: 2150000,
        acc_name: 'rokky5225555',
        symbol: 'UOSTEST',
      });

      return res;
    };
  }

  public static mockAirdropsTransactionsSenderForError() {
    AirdropsTransactionsSender.sendTransaction = async (
      // @ts-ignore
      item: AirdropsUserToChangeStatusDto,
    ) => {
      throw new Error('Internal Service Error');
    };
  }

  static mockAllTransactionSigning() {
    orgCounter = 1;
    postCreationCounter = 1;

    this.mockPostTransactionSigning();
    this.mockUsersActivityBackendSigner();
    this.mockCommentTransactionSigning();
    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();

    this.mockUserVotesPost();
  }

  static mockAllBlockchainJobProducers() {
    // #task - only organization now. In process
    this.mockOrganizationCreationBlockchainProducer();
  }

  public static mockAllBlockchainPart(mockSending: boolean = true): void {
    this.mockAllTransactionSigning();
    this.mockUserRegistration();

    if (mockSending) {
      this.mockSendingToQueue();
    }
  }

  private static mockUserRegistration() {
    // @ts-ignore
    EosApi.transactionToCreateNewAccount = async function(newAccountName, ownerPubKey, activePubKey) {};
    // @ts-ignore
    EosApi.isAccountAvailable = async function(accountName: string) { return true };
  }

  static mockOrganizationCreationBlockchainProducer() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    organizationService.sendOrgCreationActivityToRabbit = async function (newUserActivity) {};
  }

  static mockUsersActivityBackendSigner() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    userActivityService.getSignedFollowTransaction = async function (userFrom, userToAccountName, activityTypeId) {
      // console.log('MOCK UserActivityService.getSignedFollowTransaction is called');

      return 'sample_signed_transaction';
    };
  }

  static mockCommentTransactionSigning() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    CommentsCreatorService.addTransactionDataToBody = async function (
      body,
      // @ts-ignore
      currentUser,
      // @ts-ignore
      parentModelBlockchainId,
      // @ts-ignore
      isCommentOnComment,
      // @ts-ignore
      organizationBlockchainId = null,
    ) {
      body.blockchain_id  = 'new_comment_sample_blockchain_id';
      body.sign           = 'example_sign';

      body.signed_transaction = 'sample_signed_transaction_for_comment_creation';
    };
  }

  static mockSendingToQueue() {
    // noinspection JSUnusedLocalSymbols
    activityProducer.publish = async function (
      // @ts-ignore
      message,
      // @ts-ignore
      bindingKey,
    ) {
      return true;
    };
  }

  static mockPostTransactionSigning() {
    // @ts-ignore
    EosPostsInputProcessor.addSignedTransactionDetailsToBody = async function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      postTypeId,
      organizationBlockchainId = null,
    ) {
      if (organizationBlockchainId) {
        body.blockchain_id = `sample_new_org_post_blockchain_id_${postCreationCounter}`;
        body.signed_transaction = 'sample_new_org_post_transaction';
      } else {
        body.blockchain_id = `sample_user_himself_new_post_blockchain_id_${postCreationCounter}`;
        body.signed_transaction = 'sample_user_himself_new_post_transaction';
      }

      postCreationCounter += 1;
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesRepost = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      parentContentBlockchainId,
    ) {
      body.blockchain_id = 'sample_blockchain_id';
      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesDirectPostForOtherUser = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      accountNameTo,
    ) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesDirectPostForOrg = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      orgBlockchainIdTo,
    ) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    };
  }

  static mockOrganizationBlockchain() {
    organizationService.addSignedTransactionsForOrganizationCreation = async function (req) {
      req.blockchain_id = `sample_blockchain_id_${orgCounter}`;
      req.signed_transaction = 'sample_signed_transaction';

      orgCounter += 1;
    };
  }

  static mockUserVotesPost() {
    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserVotesContent = function (
      // @ts-ignore
      user,
      body,
      // @ts-ignore
      contentBlockchainId,
      // @ts-ignore
      activityTypeId,
    ) {
      body.signed_transaction = 'sample_signed_for_content_voting';
    };
  }

  static mockOrganizationFollowingSigning() {
    // noinspection JSUnusedLocalSymbols
    usersToOrgActivity.addSignedTransactionsForOrganizationFollowing = async function (
      body,
      // @ts-ignore
      currentUser,
      // @ts-ignore
      activityTypeId,
    ) {
      // console.log('MOCK add signed transaction is called');
      body.signed_transaction = 'sample_signed_transaction';
    };
  }

  /**
   * @deprecated
   */
  static mockBlockchainPart() {
    // noinspection JSUnusedLocalSymbols
    userActivityService.sendPayloadToRabbit = function (
      // @ts-ignore
      activity,
      // @ts-ignore
      scope,
    ) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    // noinspection JSUnusedLocalSymbols
    userActivityService.sendPayloadToRabbit = function (
      // @ts-ignore
      activity,
      // @ts-ignore
      scope,
    ) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();
  }
}

export = MockHelper;
