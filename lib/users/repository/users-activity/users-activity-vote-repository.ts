import { Transaction } from 'knex';
import { UsersActivityIndexVoteModel } from '../../interfaces/users-activity/model-interfaces';

import UsersModelProvider = require('../../users-model-provider');
import PostsModelProvider = require('../../../posts/service/posts-model-provider');
import knex = require('../../../../config/knex');
import CommentsModelProvider = require('../../../comments/service/comments-model-provider');
import RepositoryHelper = require('../../../common/repository/repository-helper');

const TABLE_NAME = UsersModelProvider.getUsersActivityVoteTableName();

class UsersActivityVoteRepository {
  public static async insertOnePostVote(
    userId: number,
    postId: number,
    interactionType: number,
    transaction: Transaction,
  ): Promise<void> {
    await transaction(TABLE_NAME).insert({
      user_id:          userId,
      entity_id:        postId,
      entity_name:      PostsModelProvider.getEntityName(),
      interaction_type: interactionType,
    });
  }

  public static async insertOneCommentVote(
    userId: number,
    postId: number,
    interactionType: number,
    transaction: Transaction,
  ): Promise<void> {
    await transaction(TABLE_NAME).insert({
      user_id:          userId,
      entity_id:        postId,
      entity_name:      CommentsModelProvider.getEntityName(),
      interaction_type: interactionType,
    });
  }

  public static async doesUserVotePost(
    userId: number,
    postId: number,
  ): Promise<boolean> {
    const data = await this.getUserVotesPost(userId, postId);

    return data !== null;
  }

  public static async doesUserVoteComment(
    userId: number,
    commentId: number,
  ): Promise<boolean> {
    const data = await this.getUserVotesComment(userId, commentId);

    return data !== null;
  }

  private static async getUserVotesPost(
    userId: number,
    postId: number,
  ): Promise<UsersActivityIndexVoteModel | null> {
    const res = await knex(TABLE_NAME)
      .where({
        user_id: userId,
        entity_id: postId,
        entity_name: PostsModelProvider.getEntityName(),
      })
      .first();

    return res || null;
  }

  private static async getUserVotesComment(
    userId: number,
    commentId: number,
  ): Promise<UsersActivityIndexVoteModel | null> {
    const res = await knex(TABLE_NAME)
      .where({
        user_id: userId,
        entity_id: commentId,
        entity_name: CommentsModelProvider.getEntityName(),
      })
      .first();

    return res || null;
  }

  public static async countUsersThatVoteContent(
    entityId: number,
    entityName: string,
    interactionType: number | null = null,
  ): Promise<number> {
    const queryBuilder = knex(TABLE_NAME)
      .count(`${TABLE_NAME}.id AS amount`)
      .where({
        entity_id: entityId,
        entity_name: entityName,
      });

    if (interactionType !== null) {
      queryBuilder.andWhere('interaction_type', interactionType);
    }

    const result = await queryBuilder;

    return RepositoryHelper.getKnexCountAsNumber(result);
  }
}

export = UsersActivityVoteRepository;
