const CommentsRepository = require('./comments-repository');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const ActivityService = require('../activity/activity-service');
const PostRepository = require('../posts/posts-repository');
const EosBlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const Joi = require('joi');
const { CreateCommentToCommentSchema } = require('./validators/comment-to-comment-schema');
const { BadRequestError } = require('../api/errors');
const AuthValidator = require('../auth/validators');
const models = require('../../models');
const db = models.sequelize;
const EosApi = require('../eos/eosApi');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
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

  async findOneForApiResponse (id, post_id) {
    const commentInstance = await CommentsRepository.findOneById(id);

    const maxDepth = await CommentsRepository.getMaxDepthByCommentableId(post_id);
    return commentInstance.toApiResponseJson(maxDepth)
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

    value['user_id'] = this.currentUser.getCurrentUserId();
    value['commentable_id'] = postId;
    value['parent_id'] = postId;

    const newComment = await models.sequelize
      .transaction(async transaction => {
        const newComment = await CommentsRepository.createNew(value, transaction);

        const blockchain_id = BlockchainUniqId.getUniqId(newComment.id, BLOCKCHAIN_COMMENT_PREFIX);
        const {path, depth} = await CommentsService.calcPathAndDepth(newComment.id, parentComment);

        await newComment.update({
          blockchain_id,
          path,
          depth
        });

        return newComment;
      });

    if (EosApi.mustSendToBlockchain()) {
      const parentPostBlockchainId = parentComment.blockchain_id;

      await ActivityService.userCreatesComment(this.currentUser, newComment.blockchain_id, parentPostBlockchainId);
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
   * @param {Object} currentUser TODO - use current user middleware and DI
   * @returns {Promise<*>}
   */
  async createNewComment(body, postId, currentUser) {
    this.currentUser = currentUser;

    // TODO provide form validation
    const data = _.pick(body, ['description', 'parent_id']);
    data['user_id'] = this.currentUser.id;
    data['commentable_id'] = postId;

    const newComment = await CommentsRepository.createNew(data);

    const blockchain_id = BlockchainUniqId.getUniqId(newComment.id, BLOCKCHAIN_COMMENT_PREFIX);
    const path = await CommentsService.calcPathAndDepth(newComment.id, newComment.parent_id);

    await newComment.update({
      blockchain_id,
      path
    });

    if (process.env.NODE_ENV === 'production') {
      const parentPostBlockchainId = await PostRepository.findBlockchainIdById(postId);

      await ActivityService.userCreatesComment(this.currentUser, newComment.blockchain_id, parentPostBlockchainId);

      await newComment.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    } else {
      await newComment.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }

    return newComment;
  }
}

module.exports = CommentsService;