const PostsRepository = require('./posts-repository');
const PostsOffersRepository = require('./post-offer/post-offer-repository');
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');
const AuthService = require('../../lib/auth/authService');
const ActivityDictionary = require('../../lib/activity/activity-types-dictionary');
const ActivityService = require('../../lib/activity/activity-service');
const EosBlockchainStatusDictionary = require('../../lib/eos/eos-blockchain-status-dictionary');

class PostService {
  static async createNewPost(req) {
    const files = req['files'];
    const user = req['user'];
    const body = req.body;

    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
      body['main_image_filename'] = files['main_image_filename'][0].filename;
    }

    const newPost = await PostsRepository.createNewPost(body, user);

    if (process.env.NODE_ENV === 'production') {
      await ActivityService.userCreatesMediaPost(user, newPost);

      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    } else {
      await newPost.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }

    return newPost;
  }

  static async findOneById(postId) {
    const currentUserId = AuthService.getCurrentUserId();

    const post = await PostsRepository.findOneById(postId, currentUserId, true);

    PostService.processOneAfterQuery(post);

    return post;
  }

  static async findAll() {
    const posts = await PostsRepository.findAllPosts();

    PostService.processAllAfterQuery(posts);

    return posts;
  }

  static async findOneByIdAndAuthor(postId, userId, isRaw, toProcess = true) {
    const post = await PostsRepository.findOneByIdAndAuthor(postId, userId, isRaw);

    if (toProcess && isRaw) {
      PostService.processOneAfterQuery(post);
    }

    return post;
  }

  static async findAllPostsOffersByAuthor(user_id) {
    return await PostsOffersRepository.findAllByAuthor(user_id);
  }

  static async findLastPostOfferByAuthor(user_id) {
    return await PostsOffersRepository.findLastByAuthor(user_id)
  }

  static async findLastPostOffer() {
    return await PostsOffersRepository.findLast();
  }

  static async findLastMediaPost() {
    const post = await PostsRepository.findLast();

    this.processOneAfterQuery(post);

    return post;
  }

  static async findAllByAuthor(userId) {
    const posts = await PostsRepository.findAllByAuthor(userId);

    PostService.processAllAfterQuery(posts);

    return posts;
  }

  static processOneAfterQuery (model) {
    if (!model) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);

    model.current_rate = model.current_rate.toFixed();
    let myselfVote = 'no_vote';

    if (model.hasOwnProperty('activity_user_posts') && model['activity_user_posts'].length > 0) {

      // User can have only one vote per post
      const userVote = model['activity_user_posts'][0];

      if (userVote.activity_type_id === ActivityDictionary.getUpvoteId()) {
        myselfVote = 'upvote';
      }
    }

    model.myselfData = {
      myselfVote
    };

    // TODO #refactor
    const numericalFields = [
      'blockchain_status'
    ];

    numericalFields.forEach(field => {
      if(model[field]) {
        model[field] = +model[field];
      }
    });

    const excludePostOffer = [
      'id',
    ];

    if (model['post_offer']) {
      for (const field in model['post_offer']) {
        if (!model['post_offer'].hasOwnProperty(field)) {
          continue;
        }

        if (excludePostOffer.indexOf(field) !== -1) {
          continue;
        }

        model[field] = model['post_offer'][field];
      }

      delete model['post_offer'];
    }
  }

  static processAllAfterQuery(models) {
    models.forEach(model => {
      PostService.processOneAfterQuery(model);
    });
  }
}

module.exports = PostService;