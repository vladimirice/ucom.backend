const PostOfferRepository = require('./post-offer-repository');
const PostsRepository = require('../posts-repository');

class PostOfferService {
  static async createNew(req) {
    const files = req['files'];
    const user = req['user'];
    const body = req.body;

    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
      body['main_image_filename'] = files['main_image_filename'][0].filename;
    }

    // Save main fields
    // Save additional fields

    const newPost = await PostOfferRepository.createNewOffer(body, user);

    // TODO send to blockchain

    // if (process.env.NODE_ENV === 'production') {
    //   await ActivityService.userCreatesMediaPost(user, newPost);
    //
    //   await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    // } else {
    //   await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
    //   console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    // }

    return newPost;
  }
}

module.exports = PostOfferService;