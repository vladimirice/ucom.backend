import { ContentTypesDictionary } from 'ucom.libs.common';
import { PostModelResponse } from './interfaces/model-interfaces';
import { UserModel } from '../users/interfaces/model-interfaces';
import { IRequestBody } from '../common/interfaces/common-types';

import PostsFetchService = require('./service/posts-fetch-service');
import PostCreatorService = require('./service/post-creator-service');
import UserActivityService = require('../users/user-activity-service');
import PostsRepository = require('./posts-repository');
import EntityImageInputService = require('../entity-images/service/entity-image-input-service');
import PostToEventIdService = require('./service/post-to-event-id-service');
import UsersModelProvider = require('../users/users-model-provider');
import NotificationsEventIdDictionary = require('../entities/dictionary/notifications-event-id-dictionary');
import UsersRepository = require('../users/users-repository');
import OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
import OrganizationsRepository = require('../organizations/repository/organizations-repository');
import PostStatsRepository = require('./stats/post-stats-repository');
import PostOfferRepository = require('./repository/post-offer-repository');
import EosContentInputProcessor = require('../eos/input-processor/content/eos-content-input-processor');

const _ = require('lodash');

const models = require('../../models');

const { BadRequestError } = require('../../lib/api/errors');

/**
 * Post Creation functions should be placed in PostCreatorService
 */
class PostService {
  /**
   *
   * @param {number} postId
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findPostStatsById(postId, raw = true) {
    return PostStatsRepository.findOneByPostId(postId, raw);
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

  public static async updateAuthorPost(
    postId: number,
    userId: number,
    body: IRequestBody,
    currentUser: UserModel,
  ) {
    const currentUserId = currentUser.id;

    // #task #refactor - use pick and wrap into transaction
    delete body.id;
    delete body.user_id;
    delete body.current_rate;
    delete body.current_vote;

    EosContentInputProcessor.areSignedTransactionUpdateDetailsOrError(body);

    // #task #optimization
    const postToUpdate = await models.posts.findOne({
      where: {
        id: postId,
      },
    });

    PostService.checkPostUpdatingConditions(postToUpdate, currentUserId);

    if (postToUpdate.post_type_id === ContentTypesDictionary.getTypeMediaPost()) {
      // noinspection AssignmentToFunctionParameterJS
      // noinspection JSValidateTypes
      body = _.pick(body, ['post_type_id', 'title', 'description', 'leading_text', 'entity_images', 'signed_transaction']);
    }

    const { updatedPost, newActivity } = await models.sequelize.transaction(async (transaction) => {
      if (postToUpdate.post_type_id === ContentTypesDictionary.getTypeOffer() && body.post_users_team) {
        await PostService.updatePostUsersTeam(postId, body, transaction);
      }

      // #refactor
      const updatePostParams = _.cloneDeep(body);
      delete updatePostParams.entity_images;

      EntityImageInputService.addEntityImageFieldFromBodyOrException(updatePostParams, body);

      await models.posts.update(updatePostParams, {
        transaction,
        where: {
          id: postId,
          user_id: userId,
        },
        returning: true,
        raw: true,
      });

      const updated = await PostsRepository.findOnlyPostItselfById(postId, transaction);

      if (updated.post_type_id === ContentTypesDictionary.getTypeOffer()) {
        await models.post_offer.update(body, {
          transaction,
          where: {
            post_id: postId,
          },
        });
      }

      const eventId: number | null = PostToEventIdService.getUpdatingEventIdByPost(updated);

      const activity = await UserActivityService.processPostIsUpdated(
        updated,
        currentUserId,
        eventId,
        transaction,
        body.signed_transaction,
      );

      return {
        updatedPost: updated,
        newActivity: activity,
      };
    });

    await UserActivityService.sendContentUpdatingPayloadToRabbitEosV2(newActivity);

    if (PostService.isDirectPost(updatedPost)) {
      return PostsFetchService.findOnePostByIdAndProcess(updatedPost.id, currentUser.id);
    }

    return updatedPost;
  }

  /**
   *
   * @param {Object} post
   * @return {boolean}
   */
  static isDirectPost(post) {
    return post.post_type_id === ContentTypesDictionary.getTypeDirectPost();
  }

  public static async processNewDirectPostCreationForUser(req, currentUser: UserModel) {
    const userIdTo = req.user_id;
    delete req.user_id;

    if (+req.body.post_type_id !== ContentTypesDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypesDictionary.getTypeDirectPost()}`,
      });
    }

    req.body.entity_id_for    = userIdTo;
    req.body.entity_name_for  = UsersModelProvider.getEntityName();
    const eventId = NotificationsEventIdDictionary.getUserCreatesDirectPostForOtherUser();

    const accountNameTo = await UsersRepository.findAccountNameById(userIdTo);
    if (!accountNameTo) {
      throw new Error(`There is no account name for userIdTo: ${userIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    return PostCreatorService.processNewPostCreation(req, eventId, currentUser);
  }

  public static async processNewDirectPostCreationForOrg(req, currentUser: UserModel) {
    const orgIdTo = req.organization_id;
    delete req.organization_id;

    if (+req.body.post_type_id !== ContentTypesDictionary.getTypeDirectPost()) {
      throw new BadRequestError({
        general: `Direct post is allowed only for post type ID ${ContentTypesDictionary.getTypeDirectPost()}`,
      });
    }

    req.body.entity_id_for    = orgIdTo;
    req.body.entity_name_for  = OrganizationsModelProvider.getEntityName();

    const eventId = NotificationsEventIdDictionary.getUserCreatesDirectPostForOrg();

    const orgBlockchainId = await OrganizationsRepository.findBlockchainIdById(orgIdTo);
    if (!orgBlockchainId) {
      throw new Error(`There is no blockchain ID for orgIdTo: ${orgIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
    }

    return PostCreatorService.processNewPostCreation(req, eventId, currentUser);
  }

  public static async findOnePostByIdAndProcess(
    postId: number,
    currentUser: UserModel,
  ): Promise<PostModelResponse | null> {
    return PostsFetchService.findOnePostByIdAndProcess(postId, currentUser.id);
  }

  static async findLastPostOfferByAuthor(userId: number) {
    return PostOfferRepository.findLastByAuthor(userId);
  }

  static async findLastMediaPostByAuthor(userId: number) {
    return PostsRepository.findLastByAuthor(userId);
  }

  static async findLastPostOffer() {
    return PostOfferRepository.findLast();
  }

  // @ts-ignore
  private static async addOrganizationPreviewData(model) {
    if (!model.organization_id) {
      return;
    }
    // #task Fetch all at once by JOIN
    model.organization = await OrganizationsRepository.findOneByIdForPreview(model.organization_id);
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
    const added = updated.filter((updatedItem) => source.find((sourceItem) => sourceItem.id === updatedItem.id) === undefined);

    const deleted = source.filter(
      (sourceItem) => updated.find((updatedItem) => updatedItem.id === sourceItem.id) === undefined,
    );

    return {
      added,
      deleted,
    };
  }

  private static checkPostUpdatingConditions(postToUpdate, currentUserId: number) {
    const unableToEdit = [
      ContentTypesDictionary.getTypeRepost(),
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
