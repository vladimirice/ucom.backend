/* tslint:disable:max-line-length */
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const { BadRequestError:badRequestError } = require('../api/errors');

const usersActivityService = require('../users/user-activity-service');

const eosService = require('../eos/eos-transaction-service');
const postsRepository = require('./repository').Main;
const eventIdDictionary = require('../entities/dictionary').EventId;

const usersActivityRepository = require('../users/repository/users-activity-repository');

class PostActivityService {
  /**
   *
   * @param {number} userIdFrom
   * @param {number} modelIdTo
   * @returns {Promise<boolean>}
   */
  static async doesUserVotePost(userIdFrom, modelIdTo) {
    return await usersActivityRepository.doesUserVotePost(userIdFrom, modelIdTo);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<*>}
   */
  static async userUpvotesPost(userFrom, modelIdTo, body) {
    // #task need DB transaction
    const activityTypeId = InteractionTypeDictionary.getUpvoteId();
    const modelTo = await this.checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo, body, activityTypeId);

    await this.userVotesPost(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await postsRepository.incrementCurrentVoteCounter(modelIdTo);

    const currentVote = await postsRepository.getPostCurrentVote(modelIdTo);

    return {
      current_vote: currentVote,
    };
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<*>}
   */
  static async userDownvotesPost(userFrom, modelIdTo, body) {
    // #task need DB transaction
    const activityTypeId = InteractionTypeDictionary.getDownvoteId();

    const modelTo = await this.checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo, body, activityTypeId);

    await this.userVotesPost(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await postsRepository.decrementCurrentVoteCounter(modelIdTo);

    const currentVote = await postsRepository.getPostCurrentVote(modelIdTo);

    return {
      current_vote: currentVote,
    };
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelId
   * @param {Object} body
   * @param {number} activityTypeId
   * @returns {Promise<Object>}
   * @private
   */
  private static async checkVotePreconditionsAndGetModelTo(userFrom, modelId, body, activityTypeId) {
    const doesExists = await PostActivityService.doesUserVotePost(userFrom.id, modelId);

    if (doesExists) {
      throw new badRequestError({
        general: 'Vote duplication is not allowed',
      });
    }

    const modelTo = await postsRepository.findOneById(modelId);

    if (modelTo.user_id === userFrom.id) {
      throw new badRequestError({
        general: 'It is not allowed to vote for your own comment',
      });
    }

    await eosService.appendSignedUserVotesContent(userFrom, body, modelTo.blockchain_id, activityTypeId);

    return modelTo;
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} modelTo
   * @param {number} activityTypeId
   * @param {string} signedTransaction
   * @returns {Promise<*>}
   * @private
   */
  static async userVotesPost(userFrom, modelTo, activityTypeId, signedTransaction) {
    const eventId = this.getEventId(activityTypeId, modelTo);

    // but also lets write in new table
    const activity = await usersActivityService.createForUserVotesPost(
      activityTypeId,
      signedTransaction,
      userFrom.id,
      modelTo.id,
      eventId,
    );

    await usersActivityService.sendPayloadToRabbit(activity);
  }

  /**
   *
   * @param {number} activityTypeId
   * @param {Object} modelTo
   * @return {number}
   * @private
   */
  private static getEventId(activityTypeId, modelTo) {
    if (activityTypeId === InteractionTypeDictionary.getUpvoteId()) {
      if (modelTo.organization_id) {
        return eventIdDictionary.getUserUpvotesPostOfOrg();
      }

      return eventIdDictionary.getUserUpvotesPostOfOtherUser();
    }

    if (activityTypeId === InteractionTypeDictionary.getDownvoteId()) {
      if (modelTo.organization_id) {
        return eventIdDictionary.getUserDownvotesPostOfOrg();
      }

      return eventIdDictionary.getUserDownvotesPostOfOtherUser();
    }

    throw new Error(`Unsupported activityTypeId: ${activityTypeId}`);
  }
}

export = PostActivityService;
