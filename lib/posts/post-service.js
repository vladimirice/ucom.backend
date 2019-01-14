/* tslint:disable:max-line-length */
const status = require('statuses');
const _ = require('lodash');

const PostsRepository = require('./posts-repository');
const PostStatsRepository = require('./stats/post-stats-repository');

const postsOffersRepository = require('./repository').PostOffer;
const models = require('../../models');

const db = models.sequelize;
const { AppError, BadRequestError } = require('../../lib/api/errors');
const QueryFilterService = require('../api/filters/query-filter-service');

const UsersActivityRepository = require('../users/repository').Activity;
const PostSanitizer = require('./post-sanitizer');
const UsersRepositories = require('../users/repository');

const OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
const { TransactionFactory, ContentTypeDictionary } = require('ucom-libs-social-transactions');
const EosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');

const UsersActivityService = require('../users/user-activity-service');
const ApiPostProcessor = require('../common/service').PostProcessor;

const PostRepositories = require('./repository');
const OrganizationRepositories = require('../organizations/repository');
const UsersModelProvider = require('../users/service').ModelProvider;

const EventIdDictionary = require('../entities/dictionary').EventId;

const EosTransactionService = require('../eos/eos-transaction-service');

const PostCreatorService  = require('./service/post-creator-service');
const PostActivityService = require('./post-activity-service');
const PostsFetchService   = require('./service/posts-fetch-service');

/**
 * Post Creation functions should be placed in PostCreatorService
 */
class PostService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async userUpvotesPost(modelIdTo, body) {
    const userFrom = this.currentUser.user;

    return await PostActivityService.userUpvotesPost(userFrom, modelIdTo, body);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} modelIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async userDownvotesPost(modelIdTo, body) {
    const userFrom = this.currentUser.user;

    return await PostActivityService.userDownvotesPost(userFrom, modelIdTo, body);
  }

  // noinspection JSUnusedGlobalSymbols
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
        post_id,
      },
      raw: true,
    });

    const deltas = this.getDelta(sourceModel, params['post_users_team']);

    await this.updateRelations(post_id, deltas, 'post_users_team', transaction);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} post_id
   * @param {number} user_id
   * @param {Array} params
   * @returns {Promise<Object>}
   */
  async updateAuthorPost(post_id, user_id, params) {
    const currentUserId = this.currentUser.id;

    // TODO #refactor - use pick and wrap into transaction
    delete params['id'];
    delete params['user_id'];
    delete params['current_rate'];
    delete params['current_vote'];

    // noinspection JSDeprecatedSymbols
    PostSanitizer.sanitisePost(params);
    PostCreatorService.processEntityImagesWhileUpdating(params);

    // TODO #optimization
    const postToUpdate = await models['posts'].findOne({
      where: {
        id: post_id,
      },
    });

    this._checkPostUpdatingConditions(postToUpdate);

    if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeMediaPost()) {
      // noinspection AssignmentToFunctionParameterJS
      // noinspection JSValidateTypes
      params = _.pick(params, ['post_type_id', 'title', 'description', 'main_image_filename', 'leading_text', 'entity_images']);
    }

    const { updatedPost, newActivity } = await db
      .transaction(async transaction => {

        if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeOffer() && params['post_users_team']) {
        await PostService.updatePostUsersTeam(post_id, params, transaction);
      }

        const [updatedCount, updatedPosts] = await models['posts'].update(params, {
        where: {
          id: post_id,
          user_id,
        },
        returning: true,
        raw: true,
        transaction,
      });

        if (updatedCount === 0) {
        throw new AppError(`There is no post with ID ${post_id} and author ID ${user_id}`, status('not found'));
      }

        const updatedPost = updatedPosts[0];

        if (updatedPost.post_type_id === ContentTypeDictionary.getTypeOffer()) {
        await models['post_offer'].update(params, {
          where: {
            post_id,
          },
          transaction,
        });
      }

        const newActivity = await UsersActivityService.processPostIsUpdated(
        updatedPost,
        currentUserId,
        transaction,
      );

        return {
        updatedPost,
        newActivity,
      };
      });

    await UsersActivityService.sendContentUpdatingPayloadToRabbit(newActivity);

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

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} givenBody
   * @param {number} postId
   * @return {Promise<Object>}
   */
  async processRepostCreation(givenBody, postId) {
    const user = this.currentUser.user;

    return PostCreatorService.processRepostCreation(givenBody, postId, user);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewDirectPostCreationForUser(req) {
    const userIdTo = req.user_id;
    delete req.user_id;

    if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`,
      });
    }

    // noinspection JSUnusedGlobalSymbols
    req.body.entity_id_for    = userIdTo;
    req.body.entity_name_for  = UsersModelProvider.getEntityName();
    const eventId = EventIdDictionary.getUserCreatesDirectPostForOtherUser();

    const accountNameTo = await UsersRepositories.Main.findAccountNameById(userIdTo);
    if (!accountNameTo) {
      throw new Error(`There is no account name for userIdTo: ${userIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    await EosTransactionService.appendSignedUserCreatesDirectPostForOtherUser(
      req.body,
      this.currentUser.user,
      accountNameTo,
    );

    return await this.processNewPostCreation(req, eventId);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewDirectPostCreationForOrg(req) {
    const orgIdTo = req.organization_id;
    delete req.organization_id;

    if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`,
      });
    }

    req.body.entity_id_for    = orgIdTo;
    req.body.entity_name_for  = OrganizationsModelProvider.getEntityName();

    const eventId = EventIdDictionary.getUserCreatesDirectPostForOrg();

    const orgBlockchainId = await OrganizationRepositories.Main.findBlockchainIdById(orgIdTo);
    if (!orgBlockchainId) {
      throw new Error(`There is no blockchain ID for orgIdTo: ${orgIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    await EosTransactionService.appendSignedUserCreatesDirectPostForOrg(
      req.body,
      this.currentUser.user,
      orgBlockchainId,
    );

    return await this.processNewPostCreation(req, eventId);
  }

  /**
   *
   * @param {Object} req
   * @param {number|null} eventId
   * @return {Promise<Object>}
   */
  async processNewPostCreation(req, eventId = null) {
    // TODO - wrap in database transaction

    const files = req.files;
    const body  = req.body;

    // #task - provide Joi validation
    if (body && body.title && body.title.length > 255) {
      throw new BadRequestError({title: 'title is too long. Allowed size must be up to 255 symbols'})
    }

    const postTypeId = parseInt(req.body['post_type_id']);
    if (!postTypeId) {
      throw new BadRequestError({
        post_type_id: 'Post Type ID must be a valid natural number',
      });
    }

    let orgBlockchainId = null;
    if (!body.organization_id) {
      body.organization_id = null;
    } else {
      orgBlockchainId = await OrganizationRepositories.Main.findBlockchainIdById(+body.organization_id);
      if (!orgBlockchainId) {
        throw new BadRequestError({ general: `There is no orgBlockchainId for org with ID ${+body.organization_id}` }, 404);
      }
    }

    await PostService._addSignedTransactionDetailsToBody(body, this.currentUser.user, postTypeId, orgBlockchainId);

    await this._makeOrganizationRelatedChecks(body, this.currentUser.user);
    await this._addAttributesOfEntityFor(body, this.currentUser.user);
    // noinspection JSDeprecatedSymbols
    PostSanitizer.sanitisePost(body);

    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
      body['main_image_filename'] = files['main_image_filename'][0].filename;
    }

    PostCreatorService.processEntityImagesWhileCreation(body);

    const { newPost, newActivity } = await models.sequelize
      .transaction(async transaction => {
        const newPost     = await this._createPostByPostType(postTypeId, body, transaction);
        const newActivity = await this._createNewActivity(
          newPost,
          body.signed_transaction,
          this.currentUser.getId(),
          eventId,
          transaction,
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newPost,
          newActivity,
        };
      });

    await UsersActivityService.sendContentCreationPayloadToRabbit(newActivity);

    if (PostService.isDirectPost(newPost)) {
      // Direct Post creation = full post content, not only ID
      // TODO - send direct post creation transaction to blockchain
      return await this.findOnePostByIdAndProcess(newPost.id);
    } else {
      return newPost;
    }
  }

  /**
   *
   * @param {Object} newPost
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number|null} eventId
   * @param {Object} transaction
   * @return {Promise<Object>}
   * @private
   */
  async _createNewActivity(newPost, signedTransaction, currentUserId, eventId = null, transaction = null) {
    let newActivity;

    if (newPost.organization_id) {
      newActivity = await UsersActivityService.processOrganizationCreatesPost(
        newPost,
        eventId,
        signedTransaction,
        currentUserId,
        transaction,
      );
    } else {
      newActivity = await UsersActivityService.processUserHimselfCreatesPost(
        newPost,
        eventId,
        signedTransaction,
        currentUserId,
        transaction,
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
      case ContentTypeDictionary.getTypeRepost():
        newPost = await PostsRepository.createNewPost(body, currentUserId, transaction);
        break;
      default:
        throw new BadRequestError({
          post_type_id: `Provided post type ID is not supported: ${postTypeId}`,
        });
    }

    return newPost;
  }

  /**
   *
   * @param {Object} body
   * @param {Object} user
   * @param {number} postTypeId
   * @param {string|null} organizationBlockchainId
   * @return {Promise<void>}
   * @private
   */
  static async _addSignedTransactionDetailsToBody(body, user, postTypeId, organizationBlockchainId = null) {
    if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
      return;
    }

    // noinspection IfStatementWithTooManyBranchesJS
    if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForMediaPost();
    } else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
      body.blockchain_id = EosBlockchainUniqid.getUniqidForPostOffer();
    } else {
      throw new BadRequestError({ post_type_id: `Unsupported post type id: ${postTypeId}` });
    }

    if (organizationBlockchainId) {
      // noinspection JSAccessibilityCheck
      body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(
        user.account_name,
        user.private_key,
        organizationBlockchainId,
        body.blockchain_id,
        postTypeId,
      );
    } else {
      // noinspection JSAccessibilityCheck
      body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(
        user.account_name,
        user.private_key,
        body.blockchain_id,
        postTypeId,
      );
    }
  }

  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async findOnePostByIdAndProcess(postId) {
    const userId = this.currentUser.id;

    const post = await PostsRepository.findOneById(postId, userId, true);

    if (!post) {
      return null;
    }

    let userToUserActivity = null;
    let currentUserPostActivity = null;

    if (userId) {
      userToUserActivity =
        await UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);

      const postsActivity = await UsersActivityRepository.findOneUserToPostsVotingAndRepostActivity(userId, [postId]);
      currentUserPostActivity = {
        posts: postsActivity,
      };
    }

    let orgTeamMembers = [];
    if (post.organization_id) {
      orgTeamMembers = await OrganizationRepositories.Main.findAllTeamMembersIds(post.organization_id);
    }

    return ApiPostProcessor.processOnePostFully(post, userId, currentUserPostActivity, userToUserActivity, orgTeamMembers);
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async findAll(query) {
    // preparation for universal class-fetching processor
    const userId      = this.currentUser.id;
    const repository  = PostsRepository;
    const params        = QueryFilterService.getQueryParametersWithRepository(query, repository);

    const [models, totalAmount] = await Promise.all([
      repository.findAllPosts(params),
      repository.countAllPosts(params),
    ]);
    // end of future universal part

    const postsIds = models.map(post => {
      return post.id;
    });

    let currentUserActivity;
    if (userId) {
      const postsActivity = await UsersActivityRepository.findOneUserToPostsVotingAndRepostActivity(userId, postsIds);
      currentUserActivity = {
        posts: postsActivity,
      };
    }

    const data = ApiPostProcessor.processManyPosts(models, userId, currentUserActivity);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  /**
   *
   * @return {Promise<Object>}
   */
  async findAndProcessAllForMyselfNewsFeed(query) {
    const currentUserId = this.currentUser.id;

    return PostsFetchService.findAndProcessAllForMyselfNewsFeed(query, currentUserId);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} userId
   * @param {Object} query
   * @return {Promise<Object>}
   */
  async findAndProcessAllForUserWallFeed(userId, query = null) {
    const currentUserId = this.currentUser.id;

    return PostsFetchService.findAndProcessAllForUserWallFeed(userId, currentUserId, query);
  }

  /**
   *
   * @param {string} tagTitle
   * @param {Object} query
   * @returns {Promise<{data: Array, metadata: {total_amount: *, page: number, per_page: number, has_more: boolean}}>}
   */
  async findAndProcessAllForTagWallFeed(tagTitle, query) {
    QueryFilterService.checkLastIdExistence(query);

    const currentUserId = this.currentUser.id;

    return PostsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, query);
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async findAndProcessAllForOrgWallFeed(orgId, query) {
    const userId = this.currentUser.id;

    return PostsFetchService.findAndProcessAllForOrgWallFeed(orgId, query, userId);
  }

  static async findLastPostOfferByAuthor(user_id) {
    return await postsOffersRepository.findLastByAuthor(user_id);
  }

  static async findLastMediaPostByAuthor(user_id) {
    return await PostsRepository.findLastByAuthor(user_id);
  }

  static async findLastPostOffer() {
    return await postsOffersRepository.findLast();
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
          id: data.id,
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
      return source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined;
    });

    const deleted = source.filter(
      sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined,
    );

    return {
      added,
      deleted,
    };
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

    // Repost is created only for user, not for organization

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
   * @param {number|null} organization_id
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
      user_id,
    );

    if (!isOrgAuthor && !isTeamMember) {
      throw new AppError('It is not permitted to create post on behalf of this organization', 403);
    }
  }

  /**
   *
   * @param {Object} postToUpdate
   * @private
   */
  _checkPostUpdatingConditions(postToUpdate) {
    const unableToEdit = [
      ContentTypeDictionary.getTypeRepost(),
    ];

    if (~unableToEdit.indexOf(postToUpdate.post_type_id)) {
      throw new BadRequestError({
        post_type_id: `It is not allowed to update post with type ${postToUpdate.post_type_id}`,
      });
    }
  }

}

module.exports = PostService;
