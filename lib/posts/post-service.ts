/* eslint-disable max-len */
/* tslint:disable:max-line-length no-parameter-reassignment */
import { PostModelResponse } from './interfaces/model-interfaces';
import { RequestQueryDto } from '../api/filters/interfaces/query-filter-interfaces';
import { IdOnlyDto } from '../common/interfaces/common-types';

import PostsFetchService = require('./service/posts-fetch-service');
import PostCreatorService = require('./service/post-creator-service');
import UserActivityService = require('../users/user-activity-service');
import PostsRepository = require('./posts-repository');

const _ = require('lodash');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const postsRepository = require('./posts-repository');
const postStatsRepository = require('./stats/post-stats-repository');

const postsOffersRepository = require('./repository').PostOffer;
const models = require('../../models');

const { BadRequestError } = require('../../lib/api/errors');

const postSanitizer = require('./post-sanitizer');
const usersRepositories = require('../users/repository');

const organizationsModelProvider = require('../organizations/service/organizations-model-provider');

const organizationRepositories = require('../organizations/repository');
const usersModelProvider = require('../users/service').ModelProvider;

const eventIdDictionary = require('../entities/dictionary').EventId;

const eosTransactionService = require('../eos/eos-transaction-service');

const postCreatorService  = require('./service/post-creator-service');
const postActivityService = require('./post-activity-service');
const postsFetchService   = require('./service/posts-fetch-service');

/**
 * Post Creation functions should be placed in PostCreatorService
 */
class PostService {
  public currentUser;

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

    return postActivityService.userUpvotesPost(userFrom, modelIdTo, body);
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

    return postActivityService.userDownvotesPost(userFrom, modelIdTo, body);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} postId
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findPostStatsById(postId, raw = true) {
    return postStatsRepository.findOneByPostId(postId, raw);
  }

  /**
   *
   * @param {number} postId
   * @param {Array} params
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async updatePostUsersTeam(postId, params, transaction) {
    // eslint-disable-next-line you-dont-need-lodash-underscore/filter
    params.post_users_team = _.filter(params.post_users_team);

    if (!params.post_users_team || _.isEmpty(params.post_users_team)) {
      return;
    }

    // noinspection TypeScriptValidateJSTypes
    const sourceModel = await models.post_users_team.findAll({
      where: {
        post_id: postId,
      },
      raw: true,
    });

    const deltas = this.getDelta(sourceModel, params.post_users_team);

    await this.updateRelations(postId, deltas, 'post_users_team', transaction);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} postId
   * @param {number} userId
   * @param {Array} params
   * @returns {Promise<Object>}
   */
  async updateAuthorPost(postId, userId, params) {
    const currentUserId = this.currentUser.id;

    // #task #refactor - use pick and wrap into transaction
    delete params.id;
    delete params.user_id;
    delete params.current_rate;
    delete params.current_vote;

    // noinspection JSDeprecatedSymbols
    postSanitizer.sanitisePost(params);
    postCreatorService.processEntityImagesWhileUpdating(params);

    // #task #optimization
    const postToUpdate = await models.posts.findOne({
      where: {
        id: postId,
      },
    });

    PostService.checkPostUpdatingConditions(postToUpdate, currentUserId);

    if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeMediaPost()) {
      // noinspection AssignmentToFunctionParameterJS
      // noinspection JSValidateTypes
      params = _.pick(params, ['post_type_id', 'title', 'description', 'main_image_filename', 'leading_text', 'entity_images']);
    }

    const { updatedPost, newActivity } = await models.sequelize.transaction(async (transaction) => {
      if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeOffer() && params.post_users_team) {
        await PostService.updatePostUsersTeam(postId, params, transaction);
      }

      await models.posts.update(params, {
        transaction,
        where: {
          id: postId,
          user_id: userId,
        },
        returning: true,
        raw: true,
      });

      const updated = await PostsRepository.findOnlyPostItselfById(postId, transaction);

      if (updated.post_type_id === ContentTypeDictionary.getTypeOffer()) {
        await models.post_offer.update(params, {
          transaction,
          where: {
            post_id: postId,
          },
        });
      }

      const activity = await UserActivityService.processPostIsUpdated(
        updated,
        currentUserId,
        transaction,
      );

      return {
        updatedPost: updated,
        newActivity: activity,
      };
    });

    await UserActivityService.sendContentUpdatingPayloadToRabbit(newActivity);

    if (PostService.isDirectPost(updatedPost)) {
      return this.findOnePostByIdAndProcess(updatedPost.id);
    }

    return updatedPost;
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
  async processRepostCreation(givenBody, postId): Promise<IdOnlyDto> {
    const { user } = this.currentUser;

    return postCreatorService.processRepostCreation(givenBody, postId, user);
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
    req.body.entity_name_for  = usersModelProvider.getEntityName();
    const eventId = eventIdDictionary.getUserCreatesDirectPostForOtherUser();

    const accountNameTo = await usersRepositories.Main.findAccountNameById(userIdTo);
    if (!accountNameTo) {
      throw new Error(`There is no account name for userIdTo: ${userIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    await eosTransactionService.appendSignedUserCreatesDirectPostForOtherUser(
      req.body,
      this.currentUser.user,
      accountNameTo,
    );

    return this.processNewPostCreation(req, eventId);
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
    req.body.entity_name_for  = organizationsModelProvider.getEntityName();

    const eventId = eventIdDictionary.getUserCreatesDirectPostForOrg();

    const orgBlockchainId = await organizationRepositories.Main.findBlockchainIdById(orgIdTo);
    if (!orgBlockchainId) {
      throw new Error(`There is no blockchain ID for orgIdTo: ${orgIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    await eosTransactionService.appendSignedUserCreatesDirectPostForOrg(
      req.body,
      this.currentUser.user,
      orgBlockchainId,
    );

    return this.processNewPostCreation(req, eventId);
  }

  /**
   *
   * @param {Object} req
   * @param {number|null} eventId
   * @return {Promise<Object>}
   */
  async processNewPostCreation(req, eventId = null) {
    const currentUser = this.currentUser.user;

    return PostCreatorService.processNewPostCreation(req, eventId, currentUser);
  }

  public async findOnePostByIdAndProcess(
    postId: number,
  ): Promise<PostModelResponse | null> {
    const userId: number = this.currentUser.id;

    return PostsFetchService.findOnePostByIdAndProcess(postId, userId);
  }

  /**
   *
   * @return {Promise<Object>}
   */
  async findAndProcessAllForMyselfNewsFeed(query) {
    const currentUserId = this.currentUser.id;

    return postsFetchService.findAndProcessAllForMyselfNewsFeed(query, currentUserId);
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

    return postsFetchService.findAndProcessAllForUserWallFeed(userId, currentUserId, query);
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async findAndProcessAllForOrgWallFeed(
    orgId: number,
    query: RequestQueryDto,
  ) {
    const userId: number = this.currentUser.id;

    return postsFetchService.findAndProcessAllForOrgWallFeed(orgId, userId, query);
  }

  static async findLastPostOfferByAuthor(userId: number) {
    return postsOffersRepository.findLastByAuthor(userId);
  }

  static async findLastMediaPostByAuthor(userId: number) {
    return postsRepository.findLastByAuthor(userId);
  }

  static async findLastPostOffer() {
    return postsOffersRepository.findLast();
  }

  // @ts-ignore
  private static async addOrganizationPreviewData(model) {
    if (!model.organization_id) {
      return;
    }
    // #task Fetch all at once by JOIN
    model.organization = await organizationRepositories.Main.findOneByIdForPreview(model.organization_id);
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
    const promises: any = [];

    deltaData.deleted.forEach((data) => {
      const promise = models[modelName].destroy({
        transaction,
        where: {
          id: data.id,
        },
      });

      promises.push(promise);
    });

    deltaData.added.forEach((data) => {
      // #task do this beforehand
      data.post_id = postId;
      data.user_id = data.id;
      delete data.id;

      const promise = models[modelName].create(data, { transaction });

      promises.push(promise);
    });

    return Promise.all(promises);
  }

  static getDelta(source, updated) {
    const added = updated.filter(updatedItem => source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined);

    const deleted = source.filter(
      sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined,
    );

    return {
      added,
      deleted,
    };
  }

  private static checkPostUpdatingConditions(postToUpdate, currentUserId: number) {
    const unableToEdit = [
      ContentTypeDictionary.getTypeRepost(),
    ];

    if (~unableToEdit.indexOf(postToUpdate.post_type_id)) {
      throw new BadRequestError({
        post_type_id: `It is not allowed to update post with type ${postToUpdate.post_type_id}`,
      });
    }

    if (postToUpdate.user_id !== currentUserId) {
      throw new BadRequestError('Only post author can update the post');
    }
  }
}

export = PostService;
