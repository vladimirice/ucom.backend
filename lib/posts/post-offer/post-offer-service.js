const PostOfferRepository = require('./post-offer-repository');
const ActivityService = require('../../activity/activity-service');
const EosBlockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');
const ActivityProducer = require('../../jobs/activity-producer');
const PostJobSerializer = require('../post-job-serializer');
const PostSanitizer = require('../post-sanitizer');

class PostOfferService {
  static async createNew(req) {
    const files = req['files'];
    const user = req['user'];
    const body = req.body;

    PostSanitizer.sanitisePost(body);

    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
      body['main_image_filename'] = files['main_image_filename'][0].filename;
    }

    const newPost = await PostOfferRepository.createNewOffer(body, user);

    // Call IPFS
    const jobPayload = PostJobSerializer.getPostDataToCreateJob(newPost);

    try {
      await ActivityProducer.publishWithContentCreation(jobPayload);
    } catch(err) {
      winston.error(err);
      winston.error('Not possible to push to the queue. Caught, logged, and proceeded.');
    }

    if (process.env.NODE_ENV === 'production') {
      await ActivityService.userCreatesPost(user, newPost);

      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    } else {
      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }

    return newPost;
  }
}

module.exports = PostOfferService;