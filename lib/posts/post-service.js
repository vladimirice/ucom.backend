const PostsRepository = require('./posts-repository');
const PostsOffersRepository = require('./post-offer/post-offer-repository');
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');
const db = models.sequelize;
const AuthService = require('../../lib/auth/authService');
const ActivityDictionary = require('../../lib/activity/activity-types-dictionary');
const ActivityService = require('../../lib/activity/activity-service');
const EosBlockchainStatusDictionary = require('../../lib/eos/eos-blockchain-status-dictionary');
const {AppError, BadRequestError} = require('../../lib/api/errors');
const PostTypeDictionary = require('../../lib/posts/post-type-dictionary');
const UserPostProcessor = require('../users/user-post-processor');

class PostService {
  static async updateAuthorPost(post_id, user_id, params) {
    delete params['id'];
    delete params['user_id'];

    return await db
      .transaction(async transaction => {
        const [updatedCount, updatedPosts] = await models['posts'].update(params, {
          where: {
            id: post_id,
            user_id
          },
          returning: true,
          raw: true,
          transaction
        });

        if (updatedCount === 0) {
          throw new AppError(`There is no post with ID ${post_id} and author ID ${user_id}`, 404);
        }

        const updatedPost = updatedPosts[0];

        if (updatedPost.post_type_id === PostTypeDictionary.getTypeOffer()) {
          await models['post_offer'].update(params, {
            where: {
              post_id: post_id,
            },
            transaction
          });
        }

        return updatedPost;
    });
  }

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

  static async findOneByIdAndAuthor(postId, userId) {
    const post = await PostsRepository.findOneByIdAndAuthor(postId, userId, true);

    PostService.processOneAfterQuery(post);

    return post;
  }

  static async findAllPostsOffersByAuthor(user_id) {
    return await PostsOffersRepository.findAllByAuthor(user_id);
  }

  static async findLastPostOfferByAuthor(user_id) {
    return await PostsOffersRepository.findLastByAuthor(user_id)
  }

  static async findLastMediaPostByAuthor(user_id) {
    return await PostsRepository.findLastByAuthor(user_id)
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

  static addMyselfData(model) {
    const currentUserId = AuthService.getCurrentUserId();

    if (!currentUserId) {
      return;
    }

    const author = model['User'];

    if (!author) {
      return;
    }

    if (!author['followed_by']) {
      return;
    }

    UserPostProcessor.addMyselfData(author);
  };

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

    const a = 0;

    this.addMyselfData(model);



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

    for (const propName in model) {
      if (!model.hasOwnProperty(propName)) {
        continue;
      }

      if (model[propName] === null || model[propName] === undefined || model[propName] === 'null') {
        delete model[propName];
      }
    }
  }

  static processAllAfterQuery(models) {
    models.forEach(model => {
      PostService.processOneAfterQuery(model);
    });
  }
}

module.exports = PostService;