const CommentsRepository = require('./comments-repository');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');
const ActivityService = require('../activity/activity-service');
const PostRepository = require('../posts/posts-repository');
const EosBlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }


  /**
   *
   * @param {number} id
   * @param {number} parent_id
   * @returns {Promise<Array>}
   */
  static async createPath(id, parent_id) {
    if (parent_id === null) {
      return [
        id
      ];
    }

    // TODO
    // const parentPath = await CommentsRepository.getPathById(parent_id);
    return [
      id
    ];
  }

  /**
   *
   * @param {Object} body
   * @param {number} postId
   * @returns {Promise<*>}
   */
  async createNewComment(body, postId) {
    // TODO provide form validation
    const data = _.pick(body, ['description', 'parent_id']);
    data['user_id'] = this.currentUser.id;
    data['commentable_id'] = postId;

    const newComment = await CommentsRepository.createNew(data);

    const blockchain_id = BlockchainUniqId.getUniqId(newComment.id, BLOCKCHAIN_COMMENT_PREFIX);
    const path = await CommentsService.createPath(newComment.id, newComment.parent_id);

    await newComment.update({
      blockchain_id,
      path
    });

    if (process.env.NODE_ENV === 'production') {
      const parentPostBlockchainId = await PostRepository.findBlockchainIdById(data.parent_id);

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