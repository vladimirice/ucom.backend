const ActivityUserCommentRepository = require('../activity/activity-user-comment-repository');
const UsersActivityService = require('../users/user-activity-service');

const { BadRequestError } = require('../api/errors');

const EosService = require('../eos/eos-transaction-service');
const CommentsRepository = require('./repository').Main;
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const EventIdDictionary = require('../entities/dictionary').EventId;

class CommentsActivityService {

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<void>}
   */
  static async userUpvotesComment(userFrom, modelIdTo, body) {
    // #task need DB transaction
    const activityTypeId = InteractionTypeDictionary.getUpvoteId();

    const modelTo = await this._preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId);

    await this._userVotesComment(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await CommentsRepository.incrementCurrentVoteCounter(modelIdTo);

    const currentVote = await CommentsRepository.getCommentCurrentVote(modelIdTo);

    return {
      'current_vote': currentVote,
    };
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<void>}
   */
  static async userDownvotesComment(userFrom, modelIdTo, body) {
    const activityTypeId = InteractionTypeDictionary.getDownvoteId();

    const modelTo = await this._preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId);

    await this._userVotesComment(userFrom, modelTo, activityTypeId, body.signed_transaction);
    await CommentsRepository.decrementCurrentVoteCounter(modelIdTo);

    const currentVote = await CommentsRepository.getCommentCurrentVote(modelIdTo);

    return {
      'current_vote': currentVote,
    };
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} comment_id_to
   * @returns {Promise<boolean>}
   */
  static async doesUserVoteComment(user_id_from, comment_id_to) {
    return await ActivityUserCommentRepository.doesUserVoteComment(user_id_from, comment_id_to);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @param {Object} body
   * @param {number} activityTypeId
   * @returns {Promise<Object>}
   * @private
   */
  static async _preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId) {
    const doesExists = await CommentsActivityService.doesUserVoteComment(userFrom.id, modelIdTo);

    if (doesExists) {
      throw new BadRequestError({
        'general': 'Vote duplication is not allowed'
      });
    }

    const modelTo = await CommentsRepository.getModel().findOne({where: {id: modelIdTo}});

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
   * @returns {Promise<void>}
   * @private
   */
  static async _userVotesComment(userFrom, modelTo, activityTypeId, signedTransaction) {
    // should preserve old logic due to statistics - still used
    await ActivityUserCommentRepository.createNewActivity(userFrom.id, modelTo.id, activityTypeId);

    const eventId = this._getEventId(activityTypeId, modelTo);

    // but also lets write in new table
    const activity = await UsersActivityService.createForUserVotesComment(
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
        return EventIdDictionary.getUserUpvotesCommentOfOrg();
      } else {
        return EventIdDictionary.getUserUpvotesCommentOfOtherUser();
      }
    }

    if (activityTypeId === InteractionTypeDictionary.getDownvoteId()) {
      if (modelTo.organization_id) {
        return EventIdDictionary.getUserDownvotesCommentOfOrg();
      } else {
        return EventIdDictionary.getUserDownvotesCommentOfOtherUser();
      }
    }

    throw new Error(`Unsupported activityTypeId: ${activityTypeId}`);
  }

}

module.exports = CommentsActivityService;