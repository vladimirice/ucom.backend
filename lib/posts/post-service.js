const PostsRepository = require('./posts-repository');
const PostsOffersRepository = require('./post-offer/post-offer-repository');
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('../../lib/activity/activity-types-dictionary');
const ActivityService = require('../../lib/activity/activity-service');
const EosBlockchainStatusDictionary = require('../../lib/eos/eos-blockchain-status-dictionary');
const {AppError} = require('../../lib/api/errors');
const PostTypeDictionary = require('../../lib/posts/post-type-dictionary');
const UserPostProcessor = require('../users/user-post-processor');
const CommentsService = require('../comments/comments-service');
const _ = require('lodash');

class PostService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {integer} post_id
   * @param {Array} params
   * @returns {Promise<void>}
   */
  static async updatePostUsersTeam(post_id, params) {
    const sourceModel = await models['post_users_team'].findAll({
      where: {
        post_id: post_id
      },
      raw: true
    });

    const deltas = this.getDelta(sourceModel, params['post_users_team']);

    await this.updateRelations(post_id, deltas, 'post_users_team');
  }

  /**
   *
   * @param {integer} post_id
   * @param {integer} user_id
   * @param {Array} params
   * @returns {Promise<void>}
   */
  static async updateAuthorPost(post_id, user_id, params) {
    // TODO #refactor - use pick
    delete params['id'];
    delete params['user_id'];
    delete params['current_rate'];
    delete params['current_vote'];

    // TODO #optimization
    const postToUpdate = await models['posts'].findOne({
      where: {
        id: post_id
      }
    });

    if (postToUpdate.post_type_id === PostTypeDictionary.getTypeMediaPost()) {
      params = _.pick(params, ['post_type_id', 'title', 'description', 'main_image_filename', 'leading_text'])
    }

    if (postToUpdate.post_type_id === PostTypeDictionary.getTypeOffer()) {
      await this.updatePostUsersTeam(post_id, params);
    }

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

  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async findOneByIdAndProcess(postId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const post = await PostsRepository.findOneById(postId, currentUserId, false);

    return PostService.processOneAfterQuery(post, currentUserId);
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async findAll(query) {

    let offset, limit;

    limit = query['per_page'] ? +query['per_page'] : 10;

    if (!query['page']) {
      offset = 0;
    } else if (+query['page'] === 1) {
      offset = 0;
    } else {
      offset = ((query['page'] - 1) * limit);
    }

    let queryParameters = {
      offset,
      limit,
      where: {}
    };

    if (query['post_type_id']) {
      queryParameters['where']['post_type_id'] = +query['post_type_id'];
    }

    // Before processing it is better to have raw models in order to use their methods
    const posts = await PostsRepository.findAllPosts(false, queryParameters);

    const postsTotalAmount = await PostsRepository.countAllPosts(queryParameters);
    const currentUserId = this.currentUser.getCurrentUserId();

    let metadata = {
      'total_amount': postsTotalAmount,
      'page': +query['page'],
      'per_page': +query['per_page'],
      'has_more': queryParameters['offset'] + queryParameters['limit'] < postsTotalAmount,
    };

    return {
      data: PostService.processAllAfterQuery(posts, currentUserId),
      metadata
    };
  }

  static async findOneByIdAndAuthor(postId, userId) {
    const post = await PostsRepository.findOneByIdAndAuthor(postId, userId, false);

    return PostService.processOneAfterQuery(post);
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
    const post = await PostsRepository.findLast(false);

    return this.processOneAfterQuery(post);
  }

  async findAllByAuthor(userId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const posts = await PostsRepository.findAllByAuthor(userId, false);

    return PostService.processAllAfterQuery(posts, currentUserId);
  }

  static addMyselfData(model, currentUserId) {
    const author = model['User'];

    UserPostProcessor.processUser(author, currentUserId);

    if (!currentUserId) {
      return;
    }

    let myselfVote = 'no_vote';
    let join = false;

    if (model.hasOwnProperty('activity_user_posts') && model['activity_user_posts'].length > 0) {
      for (let i = 0; i < model['activity_user_posts'].length; i++) {
        const current = model['activity_user_posts'][i];

        if (ActivityDictionary.isJoinActivity(current) && current.user_id_from === currentUserId) {
          join = true;
          continue;
        }

        if (ActivityDictionary.isUpvoteActivity(current) && current.user_id_from === currentUserId) {
          myselfVote = 'upvote';
        }
      }
    }

    model.myselfData = {
      myselfVote,
      join
    };
  };

  /**
   *
   * @param {Object} post
   */
  static formatPostComments(post) {
    post.comments = post.comments.map(comment => {
      comment.path = JSON.parse(comment.path);
      return comment;
    });
  }

  static processOneAfterQuery (model, currentUserId) {
    if (!model) {
      return;
    }

    if (model['comments']) {
      this.formatPostComments(model);
    }

    model = model.toJSON();

    if (model['comments']) {
      model['comments'].sort((commentA, commentB) => {

        const a = commentA.path;
        const b = commentB.path;

        const iterationAmount = a.length > b.length ? a.length : b.length;

        for (let i = 0; i < iterationAmount; i++) {
          if (b[i] === undefined) return 1;
          if (a[i] === undefined) return -1;

          if (a[i] !== b[i]) return a[i] - b[i];
        }
      });
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);

    model.current_rate = model.current_rate.toFixed();

    this.addMyselfData(model, currentUserId);

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

    let teamMembers = [];
    if (model['post_users_team']) {
      model['post_users_team'].forEach(teamMember => {
        teamMembers.push(teamMember['User']);
      });
    }

    model['post_users_team'] = teamMembers;

    for (const propName in model) {
      if (!model.hasOwnProperty(propName)) {
        continue;
      }

      if (model[propName] === null || model[propName] === undefined || model[propName] === 'null') {
        delete model[propName];
      }
    }

    return model;
  }

  /**
   *
   * @param {Array} models
   * @param {number} currentUserId
   * @returns {Array}
   */
  static processAllAfterQuery(models, currentUserId) {
    return models.map(model => {
      return PostService.processOneAfterQuery(model, currentUserId);
    });
  }

  static async updateRelations(postId, deltaData, modelName) {
    await models.sequelize
      .transaction(async transaction => {

        // Update addresses
        await Promise.all([
          deltaData.deleted.map(async data => {
            await models[modelName].destroy({
              where: {
                id: data.id
              },
              transaction
            });
          }),

          deltaData.added.map(async data => {

            // TODO do this beforehand
            data['post_id'] = postId;
            data['user_id'] = data['id'];
            delete data['id'];

            await models[modelName].create(data);
          }),
        ]);

        return true;
      })
  }

  static getDelta(source, updated) {
    const added = updated.filter((updatedItem) => {
      return source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined
    });

    const deleted = source.filter(
      sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined
    );

    return {
      added,
      deleted
    };
  }
}

module.exports = PostService;