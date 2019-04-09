/* tslint:disable:max-line-length */
import { CommentsCreatorService } from '../../../lib/comments/service/comments-creator-service';
import { AirdropsUserToChangeStatusDto } from '../../../lib/airdrops/interfaces/dto-interfaces';

import PostCreatorService = require('../../../lib/posts/service/post-creator-service');
import AirdropsTransactionsSender = require('../../../lib/airdrops/service/blockchain/airdrops-transactions-sender');

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
  public static mockAirdropsTransactionsSenderForSuccess() {
    AirdropsTransactionsSender.sendTransaction = async (
      // @ts-ignore
      item: AirdropsUserToChangeStatusDto,
    ) => ({
      // transaction_id: `e15cf23811f3ab61f3922d97c11cedfbd79cbc2c71556bc8d3dfcaf55ca5529e${uniqid()}`,
      transaction_id: 12345,
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
    });
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

  static mockAllBlockchainPart() {
    this.mockAllTransactionSigning();

    this.mockBlockchainPart();
    this.mockSendingToQueue();
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
    PostCreatorService.addSignedTransactionDetailsToBody = async function (
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
