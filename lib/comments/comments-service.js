const CommentsRepository = require('./comments-repository');
const PostStatsService = require('../posts/stats/post-stats-service');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const ActivityService = require('../activity/activity-service');
const PostRepository = require('../posts/posts-repository');
const Joi = require('joi');
const { CreateCommentToCommentSchema } = require('./validators/comment-to-comment-schema');
const { BadRequestError } = require('../api/errors');
const AuthValidator = require('../auth/validators');
const models = require('../../models');
const db = models.sequelize;
const EosApi = require('../eos/eosApi');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';
const MAX_DEPTH = 9;

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }


  async upvoteComment(userFrom, commentIdTo) {

    const doesExists = await ActivityService.doesUserVoteComment(userFrom.id, commentIdTo);

    if (doesExists) {
      throw new BadRequestError({
        'general': 'Vote duplication is not allowed'
      });
    }

      const commentTo = await CommentsRepository.getModel().findOne({where: {id: commentIdTo}});

    const a = 0;


    if (commentTo.user_id === userFrom.id) {
      throw new BadRequestError({
        'general': 'It is not allowed to vote for your own comment'
      });
    }

    await ActivityService.userUpvotesComment(userFrom, commentTo);

    // TODO return current votes amount
    return {
      'current_vote': 100,
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
   * @param id
   * @returns {Promise<Object>}
   */
  async findOneForApiResponse (id) {
    const commentInstance = await CommentsRepository.findOneById(id);

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
      const parentPostBlockchainId = parentComment.blockchain_id;

      await ActivityService.userCreatesComment(this.currentUser.getUser(), newComment.blockchain_id, parentPostBlockchainId);
      await EosApi.processIsSendToBlockchain(newComment);

    } else {
      await EosApi.processNotRequiredToSendToBlockchain(newComment);
    }

    return newComment;
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


    if (!EosApi.mustSendToBlockchain()) {
      await EosApi.processNotRequiredToSendToBlockchain(newComment);
      return newComment;
    }

    const parentPostBlockchainId = await PostRepository.findBlockchainIdById(postId);
    await ActivityService.userCreatesComment(this.currentUser.getUser(), newComment.blockchain_id, parentPostBlockchainId);
    await EosApi.processIsSendToBlockchain(newComment);

    return newComment;
  }
}

module.exports = CommentsService;