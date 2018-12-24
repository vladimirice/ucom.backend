const CommentsRepository = require('./comments-repository');
const PostStatsService = require('../posts/stats/post-stats-service');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const PostRepository = require('../posts/posts-repository');

const models = require('../../models');
const db = models.sequelize;

const PostsModelProvider    = require('../posts/service').ModelProvider;
const CommentsModelProvider = require('../comments/service').ModelProvider;

const UsersTeamRepository = require('../users/repository').UsersTeam;
const OrgModelProvider = require('../organizations/service/organizations-model-provider');
const CommentsActivityService = require('./comments-activity-service');
const UsersActivityService = require('../users/user-activity-service');
const { TransactionFactory } = require('ucom-libs-social-transactions');

const EventIdDictionary = require('../entities/dictionary').EventId;

const ApiPostProcessor = require('../common/service/api-post-processor');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} postId
   * @return {Promise<Array>}
   */
  async findAndProcessCommentsByPostId(postId) {
    let metadata  = [];

    const dbData = await CommentsRepository.findAllByCommentableId(postId);
    const data = ApiPostProcessor.processManyComments(dbData, this.currentUser.id);

    return {
      data,
      metadata
    }
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async upvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return await CommentsActivityService.userUpvotesComment(userFrom, commentIdTo, body);
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async downvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return await CommentsActivityService.userDownvotesComment(userFrom, commentIdTo, body);
  }

  /**
   *
   * @param {number} id
   * @param {Object|null} parentComment
   * @returns {Promise<Object>}
   */
  static async calcPathAndDepth(id, parentComment) {
    if (!parentComment) {
      return {
        path: [id],
        depth: 0
      };
    }

    const parentPath = JSON.parse(parentComment.path);
    const parentDepth = parentComment.depth;

    parentPath.push(id);

    return {
      path: parentPath,
      depth: parentDepth + 1
    };
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async findAndProcessOneComment (id) {
    const comment = await CommentsRepository.findOneById(id);

    return ApiPostProcessor.processOneComment(comment, this.currentUser.id);
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async createNewCommentOnPost(body, postId) {
    const post                  = await PostRepository.findOneOnlyWithOrganization(postId);
    const parentIdInBlockchain  = post.blockchain_id;
    const parentModel           = null;
    const isCommentOnComment    = false;

    return await this._createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment)
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @param {number} commentParentId
   * @returns {Promise<Comment>}
   */
  async createNewCommentOnComment(body, postId, commentParentId) {
    const post                  = await PostRepository.findOneOnlyWithOrganization(postId);
    const parentModel           = await CommentsRepository.findOneById(commentParentId);

    const parentIdInBlockchain  = parentModel.blockchain_id;
    const isCommentOnComment    = true;

    return await this._createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment);
  }

  /**
   *
   * @param {Object}      body
   * @param {Object}      currentUser
   * @param {string}      parentModelBlockchainId
   * @param {boolean}     isCommentOnComment
   * @param {string|null} organizationBlockchainId
   * @return {Promise<void>}
   * @private
   */
  static async _addTransactionDataToBody(
    body,
    currentUser,
    parentModelBlockchainId,
    isCommentOnComment,
    organizationBlockchainId = null
  ) {
    const newCommentBlockchainId = BlockchainUniqId.getUniqIdWithoutId(BLOCKCHAIN_COMMENT_PREFIX);

    body.blockchain_id  = newCommentBlockchainId;
    body.sign           = 'example_sign';

    let signed_transaction;

    // body.signed_transaction = 'example_signed_transaction'; // TODO blockchain does not work hotfix
    //
    // return;

    if (organizationBlockchainId) {
      if (isCommentOnComment) {
        signed_transaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId
        );
      } else {
        signed_transaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId
        );
      }
    } else {
      // regular post
      if (isCommentOnComment) {
        signed_transaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId
        );
      } else {
        signed_transaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId
        );
      }
    }

    body.signed_transaction = signed_transaction;
  }

  /**
   *
   * @param {Object} post
   * @param {Object} body
   * @return {Promise<void>}
   * @private
   */
  async _processOrganizationAction(post, body) {
    if (!post.organization) {
      body.organization_id = null;
      return;
    }

    if (post.organization.user_id === this.currentUser.id) {
      body.organization_id = post.organization.id;

      return;
    }

    const isTeamMember = await UsersTeamRepository.isTeamMember(
      OrgModelProvider.getEntityName(),
      post.organization.id,
      this.currentUser.id
    );

    if (!isTeamMember) {
      body.organization_id = null;
      return;
    }

    body.organization_id = post.organization.id;
  }

  /**
   *
   * @param {Object} body
   * @param {string} parentIdInBlockchain
   * @param {Object} post
   * @param {Object|null} parentModel
   * @param {boolean} isCommentOnComment
   *
   * @return {Promise<Object>}
   * @private
   */
  async _createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment) {
    const organizationBlockchainId = post.organization ? post.organization.blockchain_id : null;

    await CommentsService._addTransactionDataToBody(
      body,
      this.currentUser.user,
      parentIdInBlockchain,
      isCommentOnComment,
      organizationBlockchainId
    );

    await this._processOrganizationAction(post, body);

    // TODO provide form validation
    const newModelData = _.pick(body, ['description', 'blockchain_id', 'organization_id']);

    newModelData.user_id        = this.currentUser.id;
    newModelData.commentable_id = post.id;
    newModelData.parent_id      = parentModel ? parentModel.id : null;

    const {newComment, newActivity} = await db
      .transaction(async transaction => {

        const newComment = await CommentsRepository.createNew(newModelData, transaction);
        const {path, depth} = await CommentsService.calcPathAndDepth(newComment.id, parentModel);
        await newComment.update({
          path,
          depth
        }, { transaction });

        await PostStatsService.incrementCommentCount(post.id, transaction);

        const eventId = this._getEventId(
          isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(),
          newComment,
          isCommentOnComment ? parentModel : post
        );

        const newActivity = await this._processBlockchainCommentCreation(
          newComment.id,
          body.signed_transaction,
          transaction,
          !!body.organization_id,
          isCommentOnComment ? newComment.parent_id : newComment.commentable_id,
          isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(),
          eventId
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newComment,
          newActivity
        };
      });

    await UsersActivityService.sendContentCreationPayloadToRabbit(newActivity);

    return newComment;
  }

  /**
   *
   * @param {string} entityName
   * @param {Object} newModel
   * @param {Object} commentableModel
   * @return {*}
   * @private
   */
  _getEventId(entityName, newModel, commentableModel) {
    if (newModel.user_id === commentableModel.user_id) {
      return null;
    }

    if (PostsModelProvider.isPost(entityName)) {
      if (commentableModel.organization) {
        return EventIdDictionary.getUserCommentsOrgPost();
      } else {
        return EventIdDictionary.getUserCommentsPost();
      }
    }

    if (CommentsModelProvider.isComment(entityName)) {
      if (commentableModel.organization) {
        return EventIdDictionary.getUserCommentsOrgComment();
      } else {
        return EventIdDictionary.getUserCommentsComment();
      }
    }

    return null;
  }

  /**
   *
   * @param {number} newCommentId
   * @param {string} signedTransaction
   * @param {Object} transaction
   * @param {boolean} isOrganization
   * @param {number} commentableId
   * @param {string} commentableName
   * @param {number} eventId
   * @return {Promise<void>}
   * @private
   */
  async _processBlockchainCommentCreation(newCommentId, signedTransaction, transaction, isOrganization, commentableId, commentableName, eventId) {
    return await UsersActivityService.processCommentCreation(
      this.currentUser.id,
      newCommentId,
      signedTransaction,
      isOrganization,
      commentableId,
      commentableName,
      eventId,
      transaction
    );
  }
}

module.exports = CommentsService;