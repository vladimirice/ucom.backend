const _ = require('lodash');
const db = require('../../../models').sequelize;
const { BadRequestError} = require('../../../lib/api/errors');

const EosTransactionService = require('../../eos/eos-transaction-service');
const UsersActivityService  = require('../../users/user-activity-service');

const UsersModelProvider = require('../../users/service').ModelProvider;

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const EventIdDictionary         = require('../../entities/dictionary').EventId;

const UsersActivityRepository = require('../../users/repository/users-activity-repository');
const PostsRepository         = require('../posts-repository');

/**
 * beginning of refactoring
 */
class PostCreatorService {

  /**
   *
   * @param {Object} givenBody
   * @param {number} postId
   * @param {Object} user
   * @return {Promise<{id: *}>}
   */
  static async processRepostCreation(givenBody, postId, user) {
    const parentPost = await this._checkParentPostOfRepost(postId, user.id);

    const body = _.pick(givenBody, ['signed_transaction', 'blockchain_id']);
    body.post_type_id = ContentTypeDictionary.getTypeRepost();
    body.parent_id = postId;

    body.entity_id_for    = user.id;
    body.entity_name_for  = UsersModelProvider.getEntityName();

    await EosTransactionService.appendSignedUserCreatesRepost(body, user, parentPost.blockchain_id);
    const eventId = EventIdDictionary.getRepostEventId(parentPost.organization_id);

    const { newPost, newActivity } = await db
      .transaction(async transaction => {
        const newPost = await PostsRepository.createNewPost(body, user.id, transaction);

        const newActivity = await PostCreatorService._createNewActivityForRepost(
          newPost,
          body.signed_transaction,
          user.id,
          eventId,
          transaction
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newPost,
          newActivity
        };
      });

    await UsersActivityService.sendContentCreationPayloadToRabbit(newActivity);

    return {
      id: newPost.id,
    };
  }

  /**
   *
   * @param {number} postId
   * @param {number} userId
   * @return {Promise<Object>}
   */
  static async _checkParentPostOfRepost(postId, userId) {
    const post = await PostsRepository.findOneOnlyWithOrganization(postId);

    if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
      throw new BadRequestError({
        general: `It is not possible to create repost on repost`
      });
    }

    if (post.post_type_id === ContentTypeDictionary.getTypeDirectPost()
      && post.entity_id_for === userId
      && post.entity_name_for === UsersModelProvider.getEntityName()
    ) {
      throw new BadRequestError({
        general: `It is not possible to create repost on direct post of yours`
      });
    }

    if (post.user_id === userId) {
      throw new BadRequestError({
        general: `It is not possible to create repost on your own post`
      });
    }

    const isRepost = await UsersActivityRepository.doesUserHaveRepost(userId, postId);

    if (isRepost) {
      throw new BadRequestError({
        general: `It is not possible to repost the same post twice by one user`,
      });
    }

    return post;
  }

  /**
   *
   * @param {Object} newPost
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} eventId
   * @param {Object} transaction
   * @return {Promise<Object>}
   * @private
   */
  static async _createNewActivityForRepost(newPost, signedTransaction, currentUserId, eventId = null, transaction = null) {
    let newActivity;

    if (newPost.organization_id) {
      newActivity = await UsersActivityService.processOrganizationCreatesRepost(
        newPost,
        eventId,
        signedTransaction,
        currentUserId,
        transaction
      );
    } else {
      newActivity = await UsersActivityService.processUserHimselfCreatesRepost(
        newPost,
        eventId,
        signedTransaction,
        currentUserId,
        transaction
      );
    }

    return newActivity;
  }
}

module.exports = PostCreatorService;