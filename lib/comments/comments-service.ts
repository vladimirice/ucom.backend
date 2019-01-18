/* tslint:disable:max-line-length */
const commentsRepository = require('./comments-repository');
const postStatsService = require('../posts/stats/post-stats-service');
const _ = require('lodash');
const blockchainUniqId = require('../eos/eos-blockchain-uniqid');
const postRepository = require('../posts/posts-repository');

const models = require('../../models');
const db = models.sequelize;

const postsModelProvider    = require('../posts/service').ModelProvider;
const commentsModelProvider = require('../comments/service').ModelProvider;

const usersTeamRepository = require('../users/repository').UsersTeam;
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const commentsActivityService = require('./comments-activity-service');
const usersActivityService = require('../users/user-activity-service');
const { TransactionFactory } = require('ucom-libs-social-transactions');

const eventIdDictionary = require('../entities/dictionary').EventId;

const apiPostProcessor = require('../common/service/api-post-processor');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

const commentsFetchService = require('./service/comments-fetch-service');

class CommentsService {
  private currentUser;

  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} postId
   * @return {Promise<Array>}
   */
  async findAndProcessCommentsByPostId(postId: number) {
    const userId = this.currentUser.id;

    return commentsFetchService.findAndProcessCommentsByPostId(postId, userId);
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async upvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return await commentsActivityService.userUpvotesComment(userFrom, commentIdTo, body);
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async downvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return await commentsActivityService.userDownvotesComment(userFrom, commentIdTo, body);
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
        depth: 0,
      };
    }

    const parentPath = JSON.parse(parentComment.path);
    const parentDepth = parentComment.depth;

    parentPath.push(id);

    return {
      path: parentPath,
      depth: parentDepth + 1,
    };
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async findAndProcessOneComment (id) {
    const comment = await commentsRepository.findOneById(id);

    return apiPostProcessor.processOneComment(comment, this.currentUser.id);
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async createNewCommentOnPost(body, postId) {
    const post                  = await postRepository.findOneOnlyWithOrganization(postId);
    const parentIdInBlockchain  = post.blockchain_id;
    const parentModel           = null;
    const isCommentOnComment    = false;

    return await this.createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment);
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @param {number} commentParentId
   * @returns {Promise<Comment>}
   */
  async createNewCommentOnComment(body, postId, commentParentId) {
    const post                  = await postRepository.findOneOnlyWithOrganization(postId);
    const parentModel           = await commentsRepository.findOneById(commentParentId);

    const parentIdInBlockchain  = parentModel.blockchain_id;
    const isCommentOnComment    = true;

    return await this.createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment);
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
  private static async addTransactionDataToBody(
    body,
    currentUser,
    parentModelBlockchainId,
    isCommentOnComment,
    organizationBlockchainId = null,
  ) {
    const newCommentBlockchainId = blockchainUniqId.getUniqIdWithoutId(BLOCKCHAIN_COMMENT_PREFIX);

    body.blockchain_id  = newCommentBlockchainId;
    body.sign           = 'example_sign';

    let signedTransaction;

    if (organizationBlockchainId) {
      if (isCommentOnComment) {
        signedTransaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      } else {
        signedTransaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      }
    } else {
      // regular post
      if (isCommentOnComment) {
        signedTransaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      } else {
        signedTransaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      }
    }

    body.signed_transaction = signedTransaction;
  }

  /**
   *
   * @param {Object} post
   * @param {Object} body
   * @return {Promise<void>}
   * @private
   */
  private async processOrganizationAction(post, body) {
    if (!post.organization) {
      body.organization_id = null;
      return;
    }

    if (post.organization.user_id === this.currentUser.id) {
      body.organization_id = post.organization.id;

      return;
    }

    const isTeamMember = await usersTeamRepository.isTeamMember(
      orgModelProvider.getEntityName(),
      post.organization.id,
      this.currentUser.id,
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
  private async createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment) {
    const organizationBlockchainId = post.organization ? post.organization.blockchain_id : null;

    await CommentsService.addTransactionDataToBody(
      body,
      this.currentUser.user,
      parentIdInBlockchain,
      isCommentOnComment,
      organizationBlockchainId,
    );

    await this.processOrganizationAction(post, body);

    // #task provide form validation
    const newModelData = _.pick(body, ['description', 'blockchain_id', 'organization_id']);

    newModelData.user_id        = this.currentUser.id;
    newModelData.commentable_id = post.id;
    newModelData.parent_id      = parentModel ? parentModel.id : null;

    const { newComment, newActivity } = await db
      .transaction(async (transaction) => {

        const newComment = await commentsRepository.createNew(newModelData, transaction);
        const { path, depth } = await CommentsService.calcPathAndDepth(newComment.id, parentModel);
        await newComment.update({
          path,
          depth,
        },                      { transaction });

        await postStatsService.incrementCommentCount(post.id, transaction);

        const eventId = this.getEventId(
          isCommentOnComment ? commentsModelProvider.getEntityName() : postsModelProvider.getEntityName(),
          newComment,
          isCommentOnComment ? parentModel : post,
        );

        const newActivity = await this.processBlockchainCommentCreation(
          newComment.id,
          body.signed_transaction,
          transaction,
          !!body.organization_id,
          isCommentOnComment ? newComment.parent_id : newComment.commentable_id,
          isCommentOnComment ? commentsModelProvider.getEntityName() : postsModelProvider.getEntityName(),
          eventId,
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newComment,
          newActivity,
        };
      });

    await usersActivityService.sendContentCreationPayloadToRabbit(newActivity);

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
  private getEventId(entityName, newModel, commentableModel) {
    if (newModel.user_id === commentableModel.user_id) {
      return null;
    }

    if (postsModelProvider.isPost(entityName)) {
      if (commentableModel.organization) {
        return eventIdDictionary.getUserCommentsOrgPost();
      }

      return eventIdDictionary.getUserCommentsPost();
    }

    if (commentsModelProvider.isComment(entityName)) {
      if (commentableModel.organization) {
        return eventIdDictionary.getUserCommentsOrgComment();
      }

      return eventIdDictionary.getUserCommentsComment();
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
   * @return {Promise<Object>}
   * @private
   */
  private async processBlockchainCommentCreation(newCommentId, signedTransaction, transaction, isOrganization, commentableId, commentableName, eventId) {
    return await usersActivityService.processCommentCreation(
      this.currentUser.id,
      newCommentId,
      signedTransaction,
      isOrganization,
      commentableId,
      commentableName,
      eventId,
      transaction,
    );
  }
}

export = CommentsService;
