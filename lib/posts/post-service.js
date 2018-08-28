const PostsRepository = require('./posts-repository');
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');
const AuthService = require('../../lib/auth/authService');
const ActivityDictionary = require('../../lib/activity/activity-types-dictionary');

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
      // TODO send post transaction to blockchain
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

  static async incrementPostVote(postId, transaction) {
    const postIdInt = Number.parseInt(postId);

    return await models['posts'].update({ current_vote: models.sequelize.literal('current_vote + 1') }, { where: { id: postIdInt } , transaction});
  }

  static async findOneByIdAndAuthor(postId, userId, isRaw, toProcess = true) {
    const post = await PostsRepository.findOneByIdAndAuthor(postId, userId, isRaw);

    if (toProcess && isRaw) {
      PostService.processOneAfterQuery(post);
    }

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
    }
  }

  static processAllAfterQuery(models) {
    models.forEach(model => {
      PostService.processOneAfterQuery(model);
    });
  }
}

module.exports = PostService;