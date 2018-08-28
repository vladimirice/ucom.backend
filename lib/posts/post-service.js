const PostsRepository = require('./posts-repository');
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');

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
    const post = await PostsRepository.findOneById(postId, true);

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

  static async findOneByIdAndAuthor(postId, userId, isRaw) {
    const post = PostsRepository.findOneByIdAndAuthor(postId, userId, isRaw);

    PostService.processOneAfterQuery(post);

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
  }

  static processAllAfterQuery(models) {
    models.forEach(model => {
      PostService.processOneAfterQuery(model);
    });
  }
}

module.exports = PostService;