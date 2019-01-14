const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const { BadRequestError } = require('../api/errors');

const UsersActivityService = require('../users/user-activity-service');

const EosService = require('../eos/eos-transaction-service');
const PostsRepository = require('./repository').Main;
const EventIdDictionary = require('../entities/dictionary').EventId;

const UsersActivityRepository = require('../users/repository/users-activity-repository');

class PostActivityService {
  /**
   *
   * @param {number} userIdFrom
   * @param {number} modelIdTo
   * @returns {Promise<boolean>}
   */
  static async doesUserVotePost(userIdFrom, modelIdTo) {
    return await UsersActivityRepository.doesUserVotePost(userIdFrom, modelIdTo);
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
    console.log('Lets check conditions');
    const modelTo = await this._checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo, body, activityTypeId);

    console.log('Lets do _userVotesPost');
    await this._userVotesPost(userFrom, modelTo, activityTypeId, body.signed_transaction);
    console.log('Lets do increment');
    await PostsRepository.incrementCurrentVoteCounter(modelIdTo);

    console.log('Lets do getCurrent vote');
    const currentVote = await PostsRepository.getPostCurrentVote(modelIdTo);

    console.log('Lets return');
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