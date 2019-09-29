import { EventsIdsDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CommentModel } from '../../../lib/comments/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');

import CommentsGenerator = require('../../generators/comments-generator');
import CommentsHelper = require('../helpers/comments-helper');

import knex = require('../../../config/knex');
import CommentsModelProvider = require('../../../lib/comments/service/comments-model-provider');
import ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

let userVlad: UserModel;

beforeAll(async () =>   { await SeedsHelper.noGraphQlMockAllWorkers(); });
afterAll(async () =>    { await SeedsHelper.afterAllWithoutGraphQl(); });
beforeEach(async () =>  { [userVlad] = await SeedsHelper.beforeAllRoutine(); });

const JEST_TIMEOUT = 10000;

describe('Update comment or reply from user', () => {
  it('update comment with a fake transaction', async () => {
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);

    const updateFields = {
      description: 'Updated description',
    };

    const updatedComment = await CommentsHelper.updateCommentForPostWithField(comment.id, userVlad, updateFields);

    expect(updatedComment.description).toBe(updateFields.description);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromAccount();
    const activity = await knex(UsersModelProvider.getUsersActivityTableName())
      .where({
        activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
        user_id_from:       userVlad.id,
        entity_id_to:       comment.id,
        entity_name:        CommentsModelProvider.getEntityName(),
        event_id:           eventId,

        entity_id_on:       postId,
        entity_name_on:     PostsModelProvider.getEntityName(),
      });
    CommonChecker.expectOnlyOneNotEmptyItem(activity);
  }, JEST_TIMEOUT);

  it('update comment on comment with a fake transaction', async () => {
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);

    const updateFields = {
      description: 'Updated description',
    };

    const commentOnComment: CommentModel =
      await CommentsGenerator.createCommentOnCommentWithFields(postId, comment.id, userVlad);

    const updatedComment = await CommentsHelper.updateCommentForPostWithField(commentOnComment.id, userVlad, updateFields);

    expect(updatedComment.description).toBe(updateFields.description);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromAccount();
    const activity = await knex(UsersModelProvider.getUsersActivityTableName())
      .where({
        activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
        user_id_from:       userVlad.id,
        entity_id_to:       commentOnComment.id,
        entity_name:        CommentsModelProvider.getEntityName(),
        event_id:           eventId,

        entity_id_on:       comment.id,
        entity_name_on:     CommentsModelProvider.getEntityName(),
      });

    CommonChecker.expectOnlyOneNotEmptyItem(activity);
  });
});
describe('Update comment or reply from organization', () => {
  it('update comment with a fake transaction', async () => {
    const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);

    const updateFields = {
      description: 'Updated description',
    };

    const updatedComment = await CommentsHelper.updateCommentForPostWithField(comment.id, userVlad, updateFields);

    expect(updatedComment.description).toBe(updateFields.description);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromOrganization();
    const activity = await knex(UsersModelProvider.getUsersActivityTableName())
      .where({
        activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
        user_id_from:       userVlad.id,
        entity_id_to:       comment.id,
        entity_name:        CommentsModelProvider.getEntityName(),
        event_id:           eventId,

        entity_id_on:       postId,
        entity_name_on:     PostsModelProvider.getEntityName(),
      });
    CommonChecker.expectOnlyOneNotEmptyItem(activity);
  }, JEST_TIMEOUT);

  it('update comment on comment with a fake transaction', async () => {
    const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);
    const updateFields = {
      description: 'Updated description',
    };

    const commentOnComment: CommentModel =
      await CommentsGenerator.createCommentOnCommentWithFields(postId, comment.id, userVlad);

    const updatedComment = await CommentsHelper.updateCommentForPostWithField(commentOnComment.id, userVlad, updateFields);

    expect(updatedComment.description).toBe(updateFields.description);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromOrganization();
    const activity = await knex(UsersModelProvider.getUsersActivityTableName())
      .where({
        activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
        user_id_from:       userVlad.id,
        entity_id_to:       commentOnComment.id,
        entity_name:        CommentsModelProvider.getEntityName(),
        event_id:           eventId,

        entity_id_on:       comment.id,
        entity_name_on:     CommentsModelProvider.getEntityName(),
      });

    CommonChecker.expectOnlyOneNotEmptyItem(activity);
  });
});
