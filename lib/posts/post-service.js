const status = require('statuses');
const _ = require('lodash');

const PostsRepository = require('./posts-repository');
const PostStatsRepository = require('./stats/post-stats-repository');

const ActivityUserPostRepository = require('../activity/activity-user-post-repository');

const PostsOffersRepository = require('./repository').PostOffer;
const EosImportance = require('../eos/eos-importance');
const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('../../lib/activity/activity-types-dictionary');
const {AppError, BadRequestError} = require('../../lib/api/errors');
const PostTypeDictionary = require('../../lib/posts/post-type-dictionary');
const UserPostProcessor = require('../users/user-post-processor');
const QueryFilterService = require('../api/filters/query-filter-service');
const ProcessorApiResponse = require('../api/processor-api-response');
const PostActivityService = require('./post-activity-service');
const UsersActivityRepository = require('../users/repository').Activity;
const ActivityProducer = require('../jobs/activity-producer');
const PostJobSerializer = require('./post-job-serializer');
const PostSanitizer = require('./post-sanitizer');
const OrganizationPostProcessor = require('../organizations/service/organization-post-processor');
const UsersRepositories = require('../users/repository');
const OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
const UsersTeamRepository = require('../users/repository').UsersTeam;
const { TransactionFactory, ContentTypeDictionary, InteractionTypeDictionary } = require('uos-app-transaction');
const EosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');

const UsersActivityService = require('../users/user-activity-service');
const PostsModelProvider = require('./service/posts-model-provider');

const PostRepositories = require('./repository');
const OrganizationRepositories = require('../organizations/repository');

const winston = require('../../config/winston');

class PostService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @returns {Promise<{current_vote: number}>}
   */
  async userUpvotesPost(userFrom, modelIdTo) {
    const modelTo = await this._checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo);

    await PostActivityService.userUpvotesPost(userFrom, modelTo);
    await PostsRepository.incrementCurrentVoteCounter(modelIdTo);

    // TODO catch unsuccessful transaction

    const currentVote = await PostsRepository.getPostCurrentVote(modelIdTo);

    return {
      'current_vote': currentVote,
    };
  }
  /**
   *
   * @param {Object} userFrom
   * @param {number} modelIdTo
   * @returns {Promise<{current_vote: number}>}
   */
  async userDownvotesPost(userFrom, modelIdTo) {
    const modelTo = await this._checkVotePreconditionsAndGetModelTo(userFrom, modelIdTo);

    // TODO need transaction
    await PostActivityService.userDownvotesPost(userFrom, modelTo);
    await PostsRepository.decrementCurrentVoteCounter(modelIdTo);

    const currentVote = await PostsRepository.getPostCurrentVote(modelIdTo);

    return {
      'current_vote': currentVote,
    };
  }

  /**
   *
   * @param {number} post_id
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findPostStatsById(post_id, raw = true) {
    return await PostStatsRepository.findOneByPostId(post_id, raw);
  }

  /**
   *
   * @param {number} post_id
   * @param {Array} params
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async updatePostUsersTeam(post_id, params, transaction) {
    params['post_users_team'] = _.filter(params['post_users_team']);

    if (!params['post_users_team'] || _.isEmpty(params['post_users_team'])) {
      return;
    }

    const sourceModel = await models['post_users_team'].findAll({
      where: {
        post_id: post_id
      },
      raw: true
    });

    const deltas = this.getDelta(sourceModel, params['post_users_team']);

    await this.updateRelations(post_id, deltas, 'post_users_team', transaction);
  }

  /**
   *
   * @param {number} post_id
   * @param {number} user_id
   * @param {Array} params
   * @returns {Promise<void>}
   */
  static async updateAuthorPost(post_id, user_id, params) {
    // TODO #refactor - use pick and wrap into transaction
    delete params['id'];
    delete params['user_id'];
    delete params['current_rate'];
    delete params['current_vote'];

    PostSanitizer.sanitisePost(params);

    // TODO #optimization
    const postToUpdate = await models['posts'].findOne({
      where: {
        id: post_id
      }
    });

    if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeMediaPost()) {
      // noinspection AssignmentToFunctionParameterJS
      params = _.pick(params, ['post_type_id', 'title', 'description', 'main_image_filename', 'leading_text'])
    }

    return await db
      .transaction(async transaction => {

      if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeOffer() && params['post_users_team']) {
        await this.updatePostUsersTeam(post_id, params, transaction);
      }

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
        throw new AppError(`There is no post with ID ${post_id} and author ID ${user_id}`, status('not found'));
      }

      const updatedPost = updatedPosts[0];

      if (updatedPost.post_type_id === ContentTypeDictionary.getTypeOffer()) {
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

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewPostCreation(req) {
    // TODO - wrap in database transaction

    console.log('Body is: ', JSON.stringify(req.body));

    const files = req.files;
    const body = req.body;

    const postTypeId = parseInt(req.body['post_type_id']);
    if (!postTypeId) {
      throw new BadRequestError({
        'post_type_id': 'Post Type ID must be a valid natural number'
      })
    }

    let orgBlockchainId = null;
    if (!body.organization_id) {
      body.organization_id = null;
    } else {
      orgBlockchainId = await OrganizationRepositories.Main.findBlockchainIdById(+body.organization_id);
      if (!orgBlockchainId) {
        throw new BadRequestError({'general': `There is no orgBlockchainId for org with ID ${+body.organization_id}`}, 404);
      }
    }

    await PostService._addSignedTransactionDetailsToBody(body, this.currentUser.user, postTypeId, orgBlockchainId);

    await this._makeOrganizationRelatedChecks(body, this.currentUser.user);
    PostSanitizer.sanitisePost(body);

    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
      body['main_image_filename'] = files['main_image_filename'][0].filename;
    }

    const { newPost, newActivity } = await models.sequelize
      .transaction(async transaction => {
        const newPost     = await this._createPostByPostType(postTypeId, body, transaction);
        const newActivity = await this._createNewActivity(newPost, body.signed_transaction, this.currentUser.getId(), transaction);

        // noinspection JSUnusedGlobalSymbols
        return {
          newPost,
          newActivity
        };
    });

    await UsersActivityService.sendContentCreationPayloadToRabbit(newActivity);

    return newPost;
  }

  /**
   *
   * @param {Object} newPost
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {Object} transaction
   * @return {Promise<Object>}
   * @private
   */
  async _createNewActivity(newPost, signedTransaction, currentUserId, transaction) {
    let newActivity;
    if (newPost.organization_id) {
      newActivity = await UsersActivityService.processOrganizationCreatesPost(
        newPost.post_type_id,
        signedTransaction,
        currentUserId,
        newPost.id,
        transaction
      );
    } else {
      newActivity = await UsersActivityService.processUserHimselfCreatesPost(
        newPost.post_type_id,
        signedTransaction,
        currentUserId,
        newPost.id,
        transaction
      );
    }

    return newActivity;
  }

  /**
   *
   * @param {number} postTypeId
   * @param {Object} body
   * @param {Object} transaction
   * @return {Promise<Object>}
   * @private
   */
  async _createPostByPostType(postTypeId, body, transaction) {
    const currentUserId = this.currentUser.getCurrentUserId();

    // TODO - provide body validation form via Joi
    let newPost;
    switch (postTypeId) {
      case PostTypeDictionary.getTypeMediaPost():
        newPost = await PostsRepository.createNewPost(body, currentUserId, transaction);
        break;
      case PostTypeDictionary.getTypeOffer():
        newPost = await PostRepositories.PostOffer.createNewOffer(body, currentUserId, transaction);
        break;
      default:
        throw new BadRequestError({
          'post_type_id': `Provided post type ID is not supported: ${postTypeId}`
        });
    }

    return newPost;
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @param {number} postTypeId
   * @param {string} organizationBlockchainId
   * @return {Promise<void>}
   * @private
   */
  static async _addSignedTransactionDetailsToBody(body, user, postTypeId, organizationBlockchainId = null) {
    if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForMediaPost();
    } else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForPostOffer();
    } else {
      throw new BadRequestError({'post_type_id': `Unsupported post type id: ${postTypeId}`});
    }

    if (organizationBlockchainId) {
      // noinspection JSAccessibilityCheck
      body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(
        user.account_name,
        user.private_key,
        organizationBlockchainId,
        body.blockchain_id,
        postTypeId
      );
    } else {
      // noinspection JSAccessibilityCheck
      body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(
        user.account_name,
        user.private_key,
        body.blockchain_id,
        postTypeId
      );
    }
  }


  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async findOneByIdAndProcess(postId) {
    const post = await PostsRepository.findOneById(postId, this.currentUser.id, false);

    let activityData = null;
    if (this.currentUser.isCurrentUser()) {
      activityData =
        await UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);
    }

    const currentUserActivity = await this._getCurrentUserActivity([ post ]);

    return PostService.processOneAfterQuery(post, this.currentUser.id, activityData, currentUserActivity);
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async findAll(query) {
    const orderByRelationMap = {
      comments_count: [
        PostsModelProvider.getPostStatsModel(),
        'comments_count'
      ],
    };

    let queryParameters = QueryFilterService.getQueryParameters(query, orderByRelationMap);

    // TODO move to QueryFilterService
    let offset, limit;

    limit = query['per_page'] ? +query['per_page'] : 10;

    // noinspection NegatedIfStatementJS
    if (!query['page']) {
      offset = 0;
    } else if (+query['page'] === 1) {
      offset = 0;
    } else {
      offset = ((query['page'] - 1) * limit);
    }

    queryParameters['offset'] = offset;
    queryParameters['limit'] = limit;
    queryParameters['where'] = {};

    if (query['post_type_id']) {
      queryParameters['where']['post_type_id'] = +query['post_type_id'];
    }

    // Before processing it is better to have raw models in order to use their methods
    const posts = await PostsRepository.findAllPosts(false, queryParameters);

    const currentUserActivity = await this._getCurrentUserActivity(posts);

    const postsTotalAmount = await PostsRepository.countAllPosts(queryParameters);
    const data = await PostService.processAllAfterQuery(posts, this.currentUser.id, currentUserActivity);

    let metadata = {
      'total_amount': postsTotalAmount,
      'page': +query['page'],
      'per_page': +query['per_page'],
      'has_more': queryParameters['offset'] + queryParameters['limit'] < postsTotalAmount,
    };

    return {
      data,
      metadata
    };
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<void>}
   */
  async findAllByAuthor(userId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const posts = await PostsRepository.findAllByAuthor(userId, false);

    const currentUserActivity = await this._getCurrentUserActivity(posts);

    return await PostService.processAllAfterQuery(posts, currentUserId, currentUserActivity);
  }

  /**
   *
   * @param {Object[]} posts
   * @return {Promise<Object[]>}
   * @private
   */
  async _getCurrentUserActivity(posts) {
    let currentUserActivity = {
      posts: {}
    };

    if (!this.currentUser.id) {
      return currentUserActivity;
    }

    let postsIds = [];

    posts.forEach(post => {
      postsIds.push(post.id);
    });

    if (this.currentUser.id) {
      const rows = await ActivityUserPostRepository.findAllUserToPostActivity(this.currentUser.id, postsIds);

      rows.forEach(data => {
        if (!currentUserActivity.posts[data.post_id_to]) {
          currentUserActivity.posts[data.post_id_to] = [];
        }

        currentUserActivity.posts[data.post_id_to].push(data);
      });
    }

    return currentUserActivity;
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

  /**
   *
   * @param {number} organization_id
   * @return {Promise<Array>}
   */
  async findAllByOrganization(organization_id) {
    const currentUserId = this.currentUser.getCurrentUserId();
    const posts = await PostsRepository.findAllByOrganization(organization_id, false);

    return {
      data: await PostService.processAllAfterQuery(posts, currentUserId),
      metadata: []
    }
  }

  static async addMyselfData(model, currentUserId, userActivityData, userPostActivity = null) {
    const author = model['User'];

    UserPostProcessor.processUser(author, currentUserId, userActivityData);

    if (!currentUserId) {
      return;
    }

    let myselfVote = 'no_vote';
    let join = false;
    let organization_member = false;

    // TODO #opt. Here is a point of a lot of single DB requests
    if (model.organization) {
      const isTeamMember = await UsersTeamRepository.isTeamMember(OrganizationsModelProvider.getEntityName(), model.organization.id, currentUserId);

      if (model.organization.user_id === currentUserId || isTeamMember) {
        organization_member = true;
      }
    }

    if (userPostActivity) {
      for (let i = 0; i < userPostActivity.length; i++) {
        const current = userPostActivity[i];

        if (InteractionTypeDictionary.isJoinActivity(current)) {
          join = true;
          continue;
        }

        if (InteractionTypeDictionary.isUpvoteActivity(current)) {
          myselfVote = 'upvote';
        } else if (InteractionTypeDictionary.getDownvoteId() === current.activity_type_id) {
          myselfVote = 'downvote';
        }
      }
    }

    model.myselfData = {
      myselfVote,
      join,
      organization_member
    };
  }

  static async _addOrganizationPreviewData(model) {
    if (!model.organization_id) {
      return;
    }
    // TODO Fetch all at once by JOIN
    model.organization = await OrganizationRepositories.Main.findOneByIdForPreview(model.organization_id);
  }

  // noinspection FunctionWithInconsistentReturnsJS
  static async processOneAfterQuery (model, currentUserId, userActivityData = null, currentUserActivity = null) {
    if (!model) {
      return;
    }

    // #refactor - remove this
    if (model.constructor.name === 'posts') {
      // noinspection AssignmentToFunctionParameterJS
      model = model.toJSON();
    }

    // TODO - this is duplication
    await this._addOrganizationPreviewData(model);

    ProcessorApiResponse.processPostComments(model, currentUserId);

    // TODO - move to separate comments processor
    if (model.comments) {
      OrganizationPostProcessor.processOneOrganizationInManyModels(model.comments);
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);

    model.current_rate = model.current_rate.toFixed();

    const userPostActivity = currentUserActivity ? currentUserActivity.posts[model.id] : null;
    await this.addMyselfData(model, currentUserId, userActivityData, userPostActivity);

    if (model['organization']) {
      // TODO - check why is duplication
      OrganizationPostProcessor.processOneOrg(model['organization']);
    }

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
        UserPostProcessor.processUser(teamMember['User']);
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
   * @param {Object} currentUserActivity
   * @returns {Array}
   */
  static async processAllAfterQuery(models, currentUserId, currentUserActivity) {
    let result = [];

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const data = await PostService.processOneAfterQuery(model, currentUserId, null, currentUserActivity);

      result.push(data);
    }

    return result;
  }

  /**
   *
   * @param {number} postId
   * @param {Object} deltaData
   * @param {string} modelName
   * @param {Object} transaction
   * @return {Promise<boolean>}
   */
  static async updateRelations(postId, deltaData, modelName, transaction) {
    const promises = [];

    deltaData.deleted.forEach(data => {
      const promise = models[modelName].destroy({
        where: {
          id: data.id
        },
        transaction,
      });

      promises.push(promise);
    });

    deltaData.added.forEach(data => {

      // TODO do this beforehand
      data['post_id'] = postId;
      data['user_id'] = data['id'];
      delete data['id'];

      const promise = models[modelName].create(data, { transaction });

      promises.push(promise);
    });

    return Promise.all(promises);
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

  /**
   *
   * @param {Object} userFrom
   * @param {number} modelId
   * @returns {Promise<Object>}
   * @private
   */
  async _checkVotePreconditionsAndGetModelTo(userFrom, modelId) {
    const doesExists = await PostActivityService.doesUserVotePost(userFrom.id, modelId);

    if (doesExists) {
      throw new BadRequestError({
        'general': 'Vote duplication is not allowed'
      });
    }

    const modelTo = await PostsRepository.findOneById(modelId);

    if (modelTo.user_id === userFrom.id) {
      throw new BadRequestError({
        'general': 'It is not allowed to vote for your own comment'
      });
    }

    return modelTo;
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @return {Promise<void>}
   * @private
   */
  async _makeOrganizationRelatedChecks(body, user) {
    if (!body.organization_id) {
      return;
    }

    const doesExist = await OrganizationRepositories.Main.doesExistById(body.organization_id);

    if (!doesExist) {
      throw new AppError(`There is no organization with ID ${body.organization_id}.`, 404);
    }

    await this._checkCreationBehalfPermissions(user.id, body.organization_id);
  }

  /**
   *
   * @param {number} user_id
   * @param {number} organization_id
   * @return {Promise<void>}
   * @private
   */
  async _checkCreationBehalfPermissions(user_id, organization_id = null) {
    if (organization_id === null) {
      return;
    }

    // Check if user is an author of the organization
    const isOrgAuthor = await OrganizationRepositories.Main.isUserAuthor(organization_id, user_id);

    const isTeamMember = await UsersRepositories.UsersTeam.isTeamMember(
      OrganizationsModelProvider.getEntityName(),
      organization_id,
      user_id
    );

    if (!isOrgAuthor && !isTeamMember) {
      throw new AppError(`It is not permitted to create post on behalf of this organization`, 403);
    }
  }

}

module.exports = PostService;