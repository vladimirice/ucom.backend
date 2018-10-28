const { InteractionTypeDictionary } = require('uos-app-transaction');
const { BadRequestError } = require('../api/errors');

const UsersActivityService = require('../users/user-activity-service');

const ActivityUserPostRepository = require('../activity/activity-user-post-repository');

const EosService = require('../eos/eos-transaction-service');
const PostsRepository = require('./repository').Main;
const EventIdDictionary = require('../entities/dictionary').EventId;

class PostActivityService {
  /**
   *
   * @param {number} user_id_from
   * @param {number} comment_id_to
   * @returns {Promise<boolean>}
   */
  static async doesUserVotePost(user_id_from, comment_id_to) {
    return await ActivityUserPostRepository.doesUserVotePost(user_id_from, comment_id_to);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<*>}
   */
  static async userUpvotesPost(userFrom, modelIdTo, body) {
    // TODO need DB transaction
    const activityTypeId = InteractionTypeDictionary.getUpvoteId();
    const modelTo = await this._checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo, body, activityTypeId);

    await this._userVotesPost(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await PostsRepository.incrementCurrentVoteCounter(modelIdTo);

    const currentVote = await PostsRepository.getPostCurrentVote(modelIdTo);

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
    // TODO need DB transaction
    const activityTypeId = InteractionTypeDictionary.getDownvoteId();

    const modelTo = await this._checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo, body, activityTypeId);

    await this._userVotesPost(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await PostsRepository.decrementCurrentVoteCounter(modelIdTo);

    const currentVote = await PostsRepository.getPostCurrentVote(modelIdTo);

    return {
      'current_vote': currentVote,
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
  static async _checkVotePreconditionsAndGetModelTo(userFrom, modelId, body, activityTypeId) {
    const doesExists = await PostActivityService.doesUserVotePost(userFrom.id, modelId);

    if (doesExists) {
      throw new BadRequestError({
        'general': 'Vote duplication is not allowed'
      });
    }

    const modelTo = await PostsRepository.findOneById(modelId);

    if (modelTo.user_id === userFrom.id) {
      throw new BadRequestError({
        'general': 'It is not allowed to vote for your own comment'
      });
    }

    await EosService.appendSignedUserVotesContent(userFrom, body, modelTo.blockchain_id, activityTypeId);

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
  static async _userVotesPost(userFrom, modelTo, activityTypeId, signedTransaction) {
    // stats is still be from old table
    await ActivityUserPostRepository.createNewActivity(userFrom.id, modelTo.id, activityTypeId);

    const eventId = this._getEventId(activityTypeId, modelTo);

    // but also lets write in new table
    const activity = await UsersActivityService.createForUserVotesPost(
      activityTypeId,
      signedTransaction,
      userFrom.id,
      modelTo.id,
      eventId
    );

    await UsersActivityService.sendPayloadToRabbit(activity);
  }

  /**
   *
   * @param {number} activityTypeId
   * @param {Object} modelTo
   * @return {number}
   * @private
   */
  static _getEventId(activityTypeId, modelTo) {
    if (activityTypeId === InteractionTypeDictionary.getUpvoteId()) {
      if (modelTo.organization_id) {
        return EventIdDictionary.getUserUpvotesPostOfOrg();
      } else {
        return EventIdDictionary.getUserUpvotesPostOfOtherUser();
      }
    }

    if (activityTypeId === InteractionTypeDictionary.getDownvoteId()) {
      if (modelTo.organization_id) {
        return EventIdDictionary.getUserDownvotesPostOfOrg();
      } else {
        return EventIdDictionary.getUserDownvotesPostOfOtherUser();
      }
    }

    throw new Error(`Unsupported activityTypeId: ${activityTypeId}`);
  }
}

module.exports = PostActivityService;