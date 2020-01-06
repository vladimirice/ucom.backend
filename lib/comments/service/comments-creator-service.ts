import { EventsIdsDictionary } from 'ucom.libs.common';
import { CommentModel, CommentModelInput } from '../interfaces/model-interfaces';
import { UserModel } from '../../users/interfaces/model-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { PostModel } from '../../posts/interfaces/model-interfaces';

import PostsRepository = require('../../posts/posts-repository');
import CommentsRepository = require('../comments-repository');
import PostStatsService = require('../../posts/stats/post-stats-service');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import CommentsModelProvider = require('./comments-model-provider');
import UserActivityService = require('../../users/user-activity-service');
import UsersTeamRepository = require('../../users/repository/users-team-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import EntityImageInputService = require('../../entity-images/service/entity-image-input-service');
import CommentsInputProcessor = require('../validators/comments-input-processor');
import EosInputProcessor = require('../../eos/input-processor/content/eos-input-processor');

const _ = require('lodash');

const db = require('../../../models').sequelize;

export class CommentsCreatorService {
  public static async createNewCommentOnComment(
    body: any,
    postId: number,
    commentParentId: number,
    currentUser: UserModel,
  ) {
    CommentsInputProcessor.process(body);

    const post                  = await PostsRepository.findOneOnlyWithOrganization(postId);
    const parentModel           = await CommentsRepository.findOneById(commentParentId);

    const isCommentOnComment    = true;

    return this.createNewComment(body, post, parentModel, isCommentOnComment, currentUser);
  }

  public static async createNewCommentOnPost(body: any, postId: number, currentUser: UserModel): Promise<any> {
    CommentsInputProcessor.process(body);

    const post                  = await PostsRepository.findOneOnlyWithOrganization(postId);
    const parentModel           = null;
    const isCommentOnComment    = false;

    return this.createNewComment(
      body,
      post,
      parentModel,
      isCommentOnComment,
      currentUser,
    );
  }

  private static async createNewComment(
    body: IRequestBody,
    post: PostModel,
    parentModel: CommentModel | null,
    isCommentOnComment: boolean,
    currentUser: UserModel,
  ) {
    const signedTransaction = body.signed_transaction || '';
    EosInputProcessor.isBlockchainIdOrError(body);

    await this.processOrganizationAction(post, body, currentUser);

    // #task provide form validation
    const newModelData: CommentModelInput = _.pick(body, ['description', 'blockchain_id', 'organization_id']);

    newModelData.user_id        = currentUser.id;
    newModelData.commentable_id = post.id;
    newModelData.parent_id      = parentModel ? parentModel.id : null;

    EntityImageInputService.addEntityImageFieldFromBodyOrException(newModelData, body);

    const { newModel, newActivity } = await db
      .transaction(async (transaction) => {
        const newComment = await CommentsRepository.createNew(newModelData, transaction);
        const { path, depth } = await this.calcPathAndDepth(newComment.id, parentModel);
        await newComment.update({
          path,
          depth,
        },                      { transaction });

        await PostStatsService.incrementCommentCount(post.id, transaction);

        const eventId = this.getEventId(
          isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(),
          newComment,
          isCommentOnComment ? parentModel : post,
        );

        const activity = await this.processBlockchainCommentCreation(
          newComment.id,
          signedTransaction,
          transaction,
          !!body.organization_id,
          isCommentOnComment ? newComment.parent_id : newComment.commentable_id,
          isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(),
          eventId,
          currentUser,
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newModel: newComment,
          newActivity: activity,
        };
      });

    await UserActivityService.sendContentCreationPayloadToRabbitWithSuppressEmpty(newActivity);

    return newModel;
  }

  /**
   *
   * @param {string} entityName
   * @param {Object} newModel
   * @param {Object} commentableModel
   * @return {*}
   * @private
   */
  private static getEventId(entityName, newModel, commentableModel) {
    if (newModel.user_id === commentableModel.user_id) {
      return null; // #task - always fill event_id but it it possible that notification processor depends on this value
    }

    if (PostsModelProvider.isPost(entityName)) {
      if (commentableModel.organization) {
        return EventsIdsDictionary.getUserCommentsOrgPost();
      }

      return EventsIdsDictionary.getUserCommentsPost();
    }

    if (CommentsModelProvider.isComment(entityName)) {
      if (commentableModel.organization) {
        return EventsIdsDictionary.getUserCommentsOrgComment();
      }

      return EventsIdsDictionary.getUserCommentsComment();
    }

    return null;
  }

  private static async processBlockchainCommentCreation(
    newCommentId,
    signedTransaction,
    transaction,
    isOrganization,
    commentableId,
    commentableName,
    eventId,
    currentUser,
  ) {
    return UserActivityService.processCommentCreation(
      currentUser.id,
      newCommentId,
      signedTransaction,
      isOrganization,
      commentableId,
      commentableName,
      eventId,
      transaction,
    );
  }

  private static async processOrganizationAction(post, body, currentUser) {
    if (!post.organization) {
      body.organization_id = null;
      return;
    }

    if (post.organization.user_id === currentUser.id) {
      body.organization_id = post.organization.id;

      return;
    }

    const isTeamMember = await UsersTeamRepository.isTeamMember(
      OrganizationsModelProvider.getEntityName(),
      post.organization.id,
      currentUser.id,
    );

    if (!isTeamMember) {
      body.organization_id = null;
      return;
    }

    body.organization_id = post.organization.id;
  }

  /**
   *
   * @param {number} id
   * @param {Object|null} parentComment
   * @returns {Promise<Object>}
   */
  private static async calcPathAndDepth(id, parentComment) {
    if (!parentComment) {
      return {
        path: [id],
        depth: 0,
      };
    }

    const parentPath = JSON.parse(parentComment.path);
    const parentDepth = parentComment.depth;

    parentPath.push(id);

    return {
      path: parentPath,
      depth: parentDepth + 1,
    };
  }
}
