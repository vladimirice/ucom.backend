const status = require('statuses');
const _ = require('lodash');
const config = require('config');

const PostsRepository = require('./posts-repository');
const PostStatsRepository = require('./stats/post-stats-repository');

const ActivityUserPostRepository = require('../activity/activity-user-post-repository');

const PostsOffersRepository = require('./repository').PostOffer;
const models = require('../../models');
const db = models.sequelize;
const {AppError, BadRequestError} = require('../../lib/api/errors');
const QueryFilterService = require('../api/filters/query-filter-service');
const PostActivityService = require('./post-activity-service');
const UsersActivityRepository = require('../users/repository').Activity;
const PostSanitizer = require('./post-sanitizer');
const UsersRepositories = require('../users/repository');

const UsersFeedRepository = require('../common/repository').UsersFeed;

const OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
const { TransactionFactory, ContentTypeDictionary } = require('uos-app-transaction');
const EosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');

const UsersActivityService = require('../users/user-activity-service');
const PostsModelProvider = require('./service/posts-model-provider');

const ApiPostProcessor = require('../common/service').PostProcessor;

const PostRepositories = require('./repository');
const OrganizationRepositories = require('../organizations/repository');
const UsersModelProvider = require('../users/service').ModelProvider;

const EventIdDictionary = require('../entities/dictionary').EventId;

const eosConfig = config.get('eosConfig');
const blockchainIsEnabled = eosConfig.blockchain_is_enabled;

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
  async updateAuthorPost(post_id, user_id, params) {
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

    const updatedPost = await db
      .transaction(async transaction => {

      if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeOffer() && params['post_users_team']) {
        await PostService.updatePostUsersTeam(post_id, params, transaction);
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

    if (PostService.isDirectPost(updatedPost)) {
      return await this.findOnePostByIdAndProcess(updatedPost.id);
    } else {
      return updatedPost;
    }
  }

  /**
   *
   * @param {Object} post
   * @return {boolean}
   */
  static isDirectPost(post) {
    return post.post_type_id === ContentTypeDictionary.getTypeDirectPost();
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewDirectPostCreationForUser(req) {
    if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`
      })
    }

    // noinspection JSUnusedGlobalSymbols
    req.body.entity_id_for    = req.user_id;
    req.body.entity_name_for  = UsersModelProvider.getEntityName();

    delete req.user_id;

    return await this.processNewPostCreation(req);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewPostCreationForOrg(req) {
    if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`
      })
    }

    req.body.entity_id_for    = req.organization_id;
    req.body.entity_name_for  = OrganizationsModelProvider.getEntityName();

    delete req.organization_id;

    return await this.processNewPostCreation(req);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewPostCreation(req) {
    // TODO - wrap in database transaction

    // console.log('Body is: ', JSON.stringify(req.body));

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
    await this._addAttributesOfEntityFor(body, this.currentUser.user);
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

    if (PostService.isDirectPost(newPost)) {
      // TODO - send direct post creation transaction to blockchain
      return await this.findOnePostByIdAndProcess(newPost.id);
    } else {
      await UsersActivityService.sendContentCreationPayloadToRabbit(newActivity);

      return newPost;
    }
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
      case ContentTypeDictionary.getTypeMediaPost():
        newPost = await PostsRepository.createNewPost(body, currentUserId, transaction);
        break;
      case ContentTypeDictionary.getTypeOffer():
        newPost = await PostRepositories.PostOffer.createNewOffer(body, currentUserId, transaction);
        break;
      case ContentTypeDictionary.getTypeDirectPost():
        newPost = await PostsRepository.createNewPost(body, currentUserId, transaction);
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
    // noinspection IfStatementWithTooManyBranchesJS
    if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForMediaPost();
    } else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForPostOffer();
    } else if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForDirectPost()
    } else {
      throw new BadRequestError({'post_type_id': `Unsupported post type id: ${postTypeId}`});
    }

    if (!blockchainIsEnabled) {
      console.warn('blockchain is disabled by config');
      body.signed_transaction = '';
      return;
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
  async findOnePostByIdAndProcess(postId) {
    const post = await PostsRepository.findOneById(postId, this.currentUser.id, true);

    if (!post) {
      return null;
    }

    let userToUserActivity = null;
    if (this.currentUser.isCurrentUser()) {
      userToUserActivity =
        await UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);
    }

    const currentUserPostActivity = await this._getCurrentUserActivity([ post ]);

    let orgTeamMembers = [];
    if (post.organization_id) {
      orgTeamMembers = await OrganizationRepositories.Main.findAllTeamMembersIds(post.organization_id);
    }

    return ApiPostProcessor.processOnePostFully(post, this.currentUser.id, currentUserPostActivity, userToUserActivity, orgTeamMembers);
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

    let params = QueryFilterService.getQueryParameters(query, orderByRelationMap);

    // Before processing it is better to have raw models in order to use their methods
    const posts = await PostsRepository.findAllPosts(params);

    const currentUserActivity = await this._getCurrentUserActivity(posts);

    const totalAmount = await PostsRepository.countAllPosts(params);
    const data = await ApiPostProcessor.processManyPosts(posts, this.currentUser.id, currentUserActivity);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    };
  }

  /**
   *
   * @return {Promise<Object>}
   */
  async findAndProcessAllForMyselfNewsFeed(query) {
    const userId = this.currentUser.id;
    let params = QueryFilterService.getQueryParameters(query);

    const { orgIds, usersIds } = await UsersActivityRepository.findOneUserFollowActivity(userId);
    const posts = await UsersFeedRepository.findAllForUserNewsFeed(userId, usersIds, orgIds, params);
    const currentUserActivity = await this._getCurrentUserActivity(posts);

    const data = await ApiPostProcessor.processManyPosts(posts, userId, currentUserActivity);
    const totalAmount = await UsersFeedRepository.countAllForUserNewsFeed(userId, usersIds, orgIds);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    };
  }

  /**
   *
   * @param {number} userId
   * @param {Object} query
   * @return {Promise<Object>}
   */
  async findAndProcessAllForUserWallFeed(userId, query = null) {
    let params = QueryFilterService.getQueryParameters(query);

    const currentUserId = this.currentUser.getCurrentUserId();

    const posts = await UsersFeedRepository.findAllForUserWallFeed(userId, params);
    const currentUserActivity = await this._getCurrentUserActivity(posts);

    const data = await ApiPostProcessor.processManyPosts(posts, currentUserId, currentUserActivity);
    const totalAmount = await UsersFeedRepository.countAllForUserWallFeed(userId);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    };
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async findAndProcessAllForOrgWallFeed(orgId, query) {
    let params = QueryFilterService.getQueryParameters(query);

    const currentUserId = this.currentUser.getCurrentUserId();

    const posts = await UsersFeedRepository.findAllForOrgWallFeed(orgId, params);
    const currentUserActivity = await this._getCurrentUserActivity(posts);

    const data = await ApiPostProcessor.processManyPosts(posts, currentUserId, currentUserActivity);
    const totalAmount = await UsersFeedRepository.countAllForOrgWallFeed(orgId);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    }
  }

  /**
   * @param   {Object[]} posts
   * @return  {Promise<Object[]>}
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

  static async findLastPostOfferByAuthor(user_id) {
    return await PostsOffersRepository.findLastByAuthor(user_id)
  }

  static async findLastMediaPostByAuthor(user_id) {
    return await PostsRepository.findLastByAuthor(user_id)
  }

  static async findLastPostOffer() {
    return await PostsOffersRepository.findLast();
  }

  static async _addOrganizationPreviewData(model) {
    if (!model.organization_id) {
      return;
    }
    // TODO Fetch all at once by JOIN
    model.organization = await OrganizationRepositories.Main.findOneByIdForPreview(model.organization_id);
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
   * @param {Object} body
   * @param {Object} user
   * @return {Promise<void>}
   * @private
   */
  async _addAttributesOfEntityFor(body, user) {
    if (+body.post_type_id === ContentTypeDictionary.getTypeDirectPost()) {
      // direct post entity_id_for is set beforehand. Refactor this in future
      return;
    }

    if (!body.organization_id) {
      body.entity_id_for = user.id;
      body.entity_name_for = UsersModelProvider.getEntityName();

      return;
    }

    body.entity_id_for    = body.organization_id;
    body.entity_name_for  = OrganizationsModelProvider.getEntityName();
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