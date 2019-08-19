/* eslint-disable max-len */
import { CommentModel, CommentModelInput } from '../interfaces/model-interfaces';
import { UserModel } from '../../users/interfaces/model-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { PostModel } from '../../posts/interfaces/model-interfaces';

import PostsRepository = require('../../posts/posts-repository');
import CommentsRepository = require('../comments-repository');
import PostStatsService = require('../../posts/stats/post-stats-service');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import NotificationsEventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');
import CommentsModelProvider = require('./comments-model-provider');
import UserActivityService = require('../../users/user-activity-service');
import UsersTeamRepository = require('../../users/repository/users-team-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import BlockchainUniqId = require('../../eos/eos-blockchain-uniqid');
import EntityImageInputService = require('../../entity-images/service/entity-image-input-service');
import CommentsInputProcessor = require('../validators/comments-input-processor');
import EosContentInputProcessor = require('../../eos/input-processor/content/eos-content-input-processor');

const _ = require('lodash');
const { TransactionFactory } = require('ucom-libs-social-transactions');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

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

    const parentIdInBlockchain  = parentModel.blockchain_id;
    const isCommentOnComment    = true;

    return this.createNewComment(body, parentIdInBlockchain, post, parentModel, isCommentOnComment, currentUser);
  }

  public static async createNewCommentOnPost(body: any, postId: number, currentUser: UserModel): Promise<any> {
    CommentsInputProcessor.process(body);

    const post                  = await PostsRepository.findOneOnlyWithOrganization(postId);
    const parentIdInBlockchain  = post.blockchain_id;
    const parentModel           = null;
    const isCommentOnComment    = false;

    return this.createNewComment(
      body,
      parentIdInBlockchain,
      post,
      parentModel,
      isCommentOnComment,
      currentUser,
    );
  }

  private static async createNewComment(
    body: IRequestBody,
    parentIdInBlockchain: string,
    post: PostModel,
    parentModel: CommentModel | null,
    isCommentOnComment: boolean,
    currentUser: UserModel,
  ) {
    const organizationBlockchainId = post.organization ? post.organization.blockchain_id : null;

    const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);
    if (transactionDetails !== null) {
      body.blockchain_id      = transactionDetails.blockchain_id;
      body.signed_transaction = transactionDetails.signed_transaction;
    } else {
      await this.addLegacyTransactionDataToBody(
        body,
        currentUser,
        parentIdInBlockchain,
        isCommentOnComment,
        organizationBlockchainId,
      );
    }

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
          body.signed_transaction,
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

    await UserActivityService.sendContentCreationPayloadToRabbitWithEosVersion(newActivity, body.signed_transaction);

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
        return NotificationsEventIdDictionary.getUserCommentsOrgPost();
      }

      return NotificationsEventIdDictionary.getUserCommentsPost();
    }

    if (CommentsModelProvider.isComment(entityName)) {
      if (commentableModel.organization) {
        return NotificationsEventIdDictionary.getUserCommentsOrgComment();
      }

      return NotificationsEventIdDictionary.getUserCommentsComment();
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

  private static async addLegacyTransactionDataToBody(
    body: IRequestBody,
    currentUser: UserModel,
    parentModelBlockchainId: string,
    isCommentOnComment: boolean,
    organizationBlockchainId: string | null = null,
  ) {
    const newCommentBlockchainId = BlockchainUniqId.getUniqIdWithoutId(BLOCKCHAIN_COMMENT_PREFIX);

    body.blockchain_id  = newCommentBlockchainId;
    body.sign           = 'example_sign';

    let signedTransaction;

    if (organizationBlockchainId) {
      if (isCommentOnComment) {
        signedTransaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      } else {
        signedTransaction = await TransactionFactory.getSignedOrganizationCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          organizationBlockchainId,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      }
    } else {
      // regular post
      // eslint-disable-next-line no-lonely-if
      if (isCommentOnComment) {
        signedTransaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnComment(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      } else {
        signedTransaction = await TransactionFactory.getSignedUserHimselfCreatesCommentOnPost(
          currentUser.account_name,
          currentUser.private_key,
          newCommentBlockchainId,
          parentModelBlockchainId,
        );
      }
    }

    body.signed_transaction = signedTransaction;
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
