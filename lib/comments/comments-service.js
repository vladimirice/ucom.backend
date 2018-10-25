const CommentsRepository = require('./comments-repository');
const PostStatsService = require('../posts/stats/post-stats-service');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const PostRepository = require('../posts/posts-repository');
const { BadRequestError } = require('../api/errors');
const models = require('../../models');
const db = models.sequelize;

const PostsModelProvider    = require('../posts/service').ModelProvider;
const CommentsModelProvider = require('../comments/service').ModelProvider;

const UsersTeamRepository = require('../users/repository').UsersTeam;
const OrgModelProvider = require('../organizations/service/organizations-model-provider');
const CommentsActivityService = require('./comments-activity-service');
const UsersActivityService = require('../users/user-activity-service');
const { TransactionFactory } = require('uos-app-transaction');

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
   * @param {Object} userFrom
   * @param {number} commentIdTo
   * @returns {Promise<{current_vote: number}>}
   */
  async upvoteComment(userFrom, commentIdTo) {
    const commentTo = await this._checkVotePreconditionsAndGetCommentTo(userFrom, commentIdTo);

    // TODO - wrap in transaction
    await CommentsActivityService.userUpvotesComment(userFrom, commentTo);

    await CommentsRepository.incrementCurrentVoteCounter(commentIdTo);

    const currentVote = await CommentsRepository.getCommentCurrentVote(commentIdTo);

    return {
      'current_vote': currentVote,
    };
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} commentIdTo
   * @returns {Promise<{current_vote: number}>}
   */
  async downvoteComment(userFrom, commentIdTo) {
    const commentTo = await this._checkVotePreconditionsAndGetCommentTo(userFrom, commentIdTo);

    // TODO need transaction
    await CommentsActivityService.userDownvotesComment(userFrom, commentTo);
    await CommentsRepository.decrementCurrentVoteCounter(commentIdTo);


    const currentVote = await CommentsRepository.getCommentCurrentVote(commentIdTo);

    return {
      'current_vote': currentVote,
    };
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
   * @param {Object} userFrom
   * @param {number} commentIdTo
   * @returns {Promise<Object>}
   * @private
   */
  async _checkVotePreconditionsAndGetCommentTo(userFrom, commentIdTo) {
    const doesExists = await CommentsActivityService.doesUserVoteComment(userFrom.id, commentIdTo);

    if (doesExists) {
      throw new BadRequestError({
        'general': 'Vote duplication is not allowed'
      });
    }

    const commentTo = await CommentsRepository.getModel().findOne({where: {id: commentIdTo}});

    if (commentTo.user_id === userFrom.id) {
      throw new BadRequestError({
        'general': 'It is not allowed to vote for your own comment'
      });
    }

    return commentTo;
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

        const newActivity = await this._processBlockchainCommentCreation(
          newComment.id,
          body.signed_transaction,
          transaction,
          !!body.organization_id,
          newComment.commentable_id,
          isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName()
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newComment,
          newActivity
        };
      });

    await UsersActivityService.sendPayloadToRabbit(newActivity);

    return newComment;
  }

  /**
   *
   * @param {number} newCommentId
   * @param {string} signedTransaction
   * @param {Object} transaction
   * @param {boolean} isOrganization
   * @param {number} commentableId
   * @param {string} commentableName
   * @return {Promise<void>}
   * @private
   */
  async _processBlockchainCommentCreation(newCommentId, signedTransaction, transaction, isOrganization, commentableId, commentableName) {
    return await UsersActivityService.processCommentCreation(
      this.currentUser.id,
      newCommentId,
      signedTransaction,
      isOrganization,
      commentableId,
      commentableName,
      transaction
    );
  }
}

module.exports = CommentsService;