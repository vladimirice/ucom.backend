const CommentsRepository = require('./comments-repository');
const _ = require('lodash');
const BlockchainUniqId = require('../eos/eos-blockchain-uniqid');

class CommentsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @returns {Promise<*>}
   */
  async createNewComment(body, user) {

    const data = _.pick(body, ['description', 'parent_id']);
    data['user_id'] = user.id;

    const newPost = await CommentsRepository.createNew(data, user.id);

    if (process.env.NODE_ENV === 'production') {
      await ActivityService.userCreatesMediaPost(user, newPost);

      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    } else {
      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }

    return newPost;
  }
}

module.exports = CommentsService;