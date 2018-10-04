const CommentsRepository = require('./comments-repository');
const PostStatsService = require('../posts/stats/post-stats-service');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const PostRepository = require('../posts/posts-repository');
const Joi = require('joi');
const { CreateCommentToCommentSchema } = require('./validators/comment-to-comment-schema');
const { BadRequestError } = require('../api/errors');
const AuthValidator = require('../auth/validators');
const models = require('../../models');
const db = models.sequelize;
const EosApi = require('../eos/eosApi');

const UsersTeamRepository = require('../users/repository').UsersTeam;
const OrgModelProvider = require('../organizations/service/organizations-model-provider');

const OrgPostProcessor = require('../organizations/service/organization-post-processor');

const CommentsActivityService = require('./comments-activity-service');
const OrgRepository = require('../organizations/repository').Main;
const UsersActivityService = require('../users/user-activity-service');


const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';
const MAX_DEPTH = 9;

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
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

    const parentPath = parentComment.getPathAsJson();
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
  async findOneForApiResponse (id) {
    const commentInstance = await CommentsRepository.findOneById(id);
    OrgPostProcessor.processOneOrg(commentInstance.organization);

    return commentInstance.toApiResponseJson(MAX_DEPTH)
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @param {number} commentParentId
   * @returns {Promise<Comment>}
   */
  async createNewCommentOnComment(body, postId, commentParentId) {
    let {error, value} = Joi.validate(body, CreateCommentToCommentSchema);

    if (error) {
      throw new BadRequestError(
        AuthValidator.formatErrorMessages(error.details)
      );
    }

    const parentComment = await CommentsRepository.findOneById(commentParentId);

    if (parentComment.depth === MAX_DEPTH) {
      throw new BadRequestError({
        'depth': `Not possible to create comment. Max depth is reached: ${MAX_DEPTH}`
      });
    }

    value['user_id'] = this.currentUser.getCurrentUserId();
    value['commentable_id'] = postId;
    value['parent_id'] = commentParentId;

    await this._processOrganizationPost(postId, value);

    const newComment = await db
      .transaction(async transaction => {
        const newComment = await CommentsRepository.createNew(value, transaction);

        const blockchain_id = BlockchainUniqId.getUniqId(newComment.id, BLOCKCHAIN_COMMENT_PREFIX);
        const {path, depth} = await CommentsService.calcPathAndDepth(newComment.id, parentComment);

        await newComment.update({
          blockchain_id,
          path,
          depth
        });

        await PostStatsService.incrementCommentCount(postId);

        return newComment;
      });

    if (EosApi.mustSendToBlockchain()) {
      const parentCommentBlockchainId = parentComment.blockchain_id;

      await CommentsActivityService.userCreatesComment(this.currentUser.getUser(), newComment.blockchain_id, parentCommentBlockchainId);
      await EosApi.processIsSendToBlockchain(newComment);

    } else {
      await EosApi.processNotRequiredToSendToBlockchain(newComment);
    }

    return newComment;
  }

  async _processOrganizationPost(postId, data) {
    const commentablePost = await PostRepository.findOneOnlyWithOrganization(postId);

    if (!commentablePost.organization) {
      return;
    }

    if (commentablePost.organization.user_id === this.currentUser.id) {
      data['organization_id'] = commentablePost.organization.id;

      return;
    }

    const isTeamMember = await UsersTeamRepository.isTeamMember(
      OrgModelProvider.getEntityName(),
      commentablePost.organization.id,
      this.currentUser.id
    );

    if (!isTeamMember) {
      return;
    }

    data['organization_id'] = commentablePost.organization.id;
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async createNewComment(body, postId) {
    // TODO provide form validation
    const data = _.pick(body, ['description', 'parent_id']);
    data['user_id'] = this.currentUser.id;
    data['commentable_id'] = postId;
    await this._processOrganizationPost(postId, data);

    const newComment = await db
      .transaction(async transaction => {

        const newComment = await CommentsRepository.createNew(data, transaction);
        const blockchain_id = BlockchainUniqId.getUniqId(newComment.id, BLOCKCHAIN_COMMENT_PREFIX);
        const {path, depth} = await CommentsService.calcPathAndDepth(newComment.id, newComment.parent_id);
        await newComment.update({
          blockchain_id,
          path,
          depth
        });

        await PostStatsService.incrementCommentCount(postId);

        return newComment;
    });

    await this._processBlockchainCommentCreation();

    return newComment;
  }

  async _processBlockchainCommentCreation(newComment, parentModelId) {
    if (newComment.organization_id) {
    // TODO - sign on frontend
    const orgBlockchainId = await OrgRepository.findBlockchainIdById(newComment.organization_id);

    const signedTransaction = await UsersActivityService.createAndSignOrganizationCreatesPostTransaction(
      user,
      orgBlockchainId,
      newPost.blockchain_id,
      postTypeId
    );

    console.log('Signed transaction is: ', signedTransaction);

    console.log('LEts create new activity');
    console.log('postTypeId', postTypeId);
    console.log('json payload', JSON.stringify(signedTransaction));
    console.log('user.id', user.id);
    console.log('body.organization_id', body.organization_id);
    console.log('newPost.id', newPost.id);

    const newUserActivity = await UsersActivityService.processOrganizationCreatesPost(
      postTypeId,
      JSON.stringify(signedTransaction),
      user.id,
      body.organization_id,
      newPost.id
    );
    console.log('New activity is created');

    // noinspection JSUnresolvedFunction
    console.log('Lets send activity to rabbit');
    await UsersActivityService._sendPayloadToRabbit(newUserActivity, 'users_activity');
    console.log('Activity is sent to rabbit');

    } else {
      // Old comment logic

      if (!EosApi.mustSendToBlockchain()) {
        await EosApi.processNotRequiredToSendToBlockchain(newComment);
        return newComment;
      }

      const parentPostBlockchainId = await PostRepository.findBlockchainIdById(parentModelId);
      await CommentsActivityService.userCreatesComment(this.currentUser.getUser(), newComment.blockchain_id, parentPostBlockchainId);
      await EosApi.processIsSendToBlockchain(newComment);
    }
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
}

module.exports = CommentsService;