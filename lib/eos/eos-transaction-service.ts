import { IActivityOptions } from './interfaces/activity-interfaces';

const { TransactionFactory } = require('ucom-libs-social-transactions');
const eosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');

class EosTransactionService {
  /**
   *
   * @param {Object} user
   * @param {Object} body
   * @param {string} contentBlockchainId
   * @param {number} activityTypeId
   * @return {Promise<void>}
   */
  static async appendSignedUserVotesContent(user, body, contentBlockchainId, activityTypeId) {
    if (body.signed_transaction) {
      return;
    }

    body.signed_transaction = await TransactionFactory.getSignedUserToContentActivity(
      user.account_name,
      user.private_key,
      contentBlockchainId,
      activityTypeId,
    );
  }

  public static getEosVersionBasedOnSignedTransaction(signedTransaction: string): IActivityOptions {
    return {
      eosJsV2: signedTransaction.includes('serializedTransaction'),
    };
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @param {string} parentContentBlockchainId
   * @return {Promise<void>}
   */
  static async appendSignedUserCreatesRepost(body, user, parentContentBlockchainId) {
    body.blockchain_id = eosBlockchainUniqid.getUniqidForRepost();

    body.signed_transaction = await TransactionFactory.getSignedUserCreatesRepostOtherPost(
      user.account_name,
      user.private_key,
      body.blockchain_id,
      parentContentBlockchainId,
    );
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @param {string} accountNameTo
   * @return {Promise<void>}
   */
  static async appendSignedUserCreatesDirectPostForOtherUser(body, user, accountNameTo) {
    body.blockchain_id = eosBlockchainUniqid.getUniqidForDirectPost();

    body.signed_transaction = await TransactionFactory.getSignedDirectPostCreationForUser(
      user.account_name,
      user.private_key,
      accountNameTo,
      body.blockchain_id,
    );
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @param {string} orgBlockchainIdTo
   * @return {Promise<void>}
   */
  static async appendSignedUserCreatesDirectPostForOrg(body, user, orgBlockchainIdTo) {
    body.blockchain_id = eosBlockchainUniqid.getUniqidForDirectPost();

    body.signed_transaction = await TransactionFactory.getSignedDirectPostCreationForOrg(
      user.account_name,
      user.private_key,
      orgBlockchainIdTo,
      body.blockchain_id,
    );
  }
}

export = EosTransactionService;
