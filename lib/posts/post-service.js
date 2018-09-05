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

  async findOneById(postId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const post = await PostsRepository.findOneById(postId, currentUserId, true);

    PostService.processOneAfterQuery(post, currentUserId);

    return post;
  }

  async findAll() {
    const posts = await PostsRepository.findAllPosts();
    const currentUserId = this.currentUser.getCurrentUserId();

    PostService.processAllAfterQuery(posts, currentUserId);

    return posts;
  }

  static async findOneByIdAndAuthor(postId, userId) {
    const post = await PostsRepository.findOneByIdAndAuthor(postId, userId, true);

    PostService.processOneAfterQuery(post);

    return post;
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

  async findAllByAuthor(userId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const posts = await PostsRepository.findAllByAuthor(userId);

    PostService.processAllAfterQuery(posts, currentUserId);

    return posts;
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

    for(let i = 0; i < post.comments.length; i++) {
      post.comments[i].path = post.comments[i].path.replace('[', '');
      post.comments[i].path = post.comments[i].path.replace(']', '');
      post.comments[i].path = post.comments[i].path.replace(/,/g , '.');
    }

    post.comments = post.comments.sort((a, b) => {
      if (a < b)
        return -1;
      if (a > b)
        return 1;
      return 0;
    });
  }

  static processOneAfterQuery (model, currentUserId) {
    if (!model) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);

    model.current_rate = model.current_rate.toFixed();

    this.addMyselfData(model, currentUserId);

    if (model['comments']) {
      this.formatPostComments(model);
    }

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
  }

  static processAllAfterQuery(models, currentUserId) {
    models.forEach(model => {
      PostService.processOneAfterQuery(model, currentUserId);
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