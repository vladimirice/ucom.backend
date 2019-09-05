import { ContentTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';
import { PostModel } from '../../../lib/posts/interfaces/model-interfaces';
import { CommentModel } from '../../../lib/comments/interfaces/model-interfaces';
import { OrgModel } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import knex = require('../../../config/knex');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersActivityCommonHelper = require('../../helpers/users/activity/users-activity-common-helper');
import NotificationsEventIdDictionary = require('../../../lib/entities/dictionary/notifications-event-id-dictionary');
import ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import CommentsResendingService = require('../../../lib/comments/service/content-resending/comments-resending-service');

const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 15000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

beforeAll(async () => {
  await SeedsHelper.noGraphQlNoMocking();
});
afterAll(async () => {
  await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
});
beforeEach(async () => {
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
});

it('Create comment for post and provide a transaction', async () => {
  const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userJane);

  const commentContent = {
    description:    'New comment description',
    entity_images:  '{}',
  };

  const isReply = false;

  const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateCommentFromUser(
    userVlad.account_name,
    userVlad.private_key,
    post.blockchain_id,
    commentContent,
    isReply,
  );

  const requestContent: StringToAnyCollection = {
    ...commentContent,
    signed_transaction,
    blockchain_id,
  };

  const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(post.id, userVlad, requestContent);

  expect(comment.blockchain_id).toBe(blockchain_id);

  const eventId = NotificationsEventIdDictionary.getUserCommentsPost();

  const activity = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeComment(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from:       userVlad.id,
      entity_id_to:       comment.id,
      entity_name:        EntityNames.COMMENTS,
      event_id:           eventId,
      entity_id_on:       post.id,
      entity_name_on:     EntityNames.POSTS,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activity);

  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('create comment for comment and provide a transaction', async () => {
  const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userVlad);

  const parentComment: CommentModel = await CommentsGenerator.createCommentForPostWithField(
    post.id,
    userJane,
  );

  const isReply = true;

  const commentContent = {
    description:    'New comment description',
    entity_images:  '{}',
  };

  const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateCommentFromUser(
    userVlad.account_name,
    userVlad.private_key,
    parentComment.blockchain_id,
    commentContent,
    isReply,
  );

  const requestContent: StringToAnyCollection = {
    ...commentContent,
    signed_transaction,
    blockchain_id,
  };

  const comment: CommentModel = await CommentsGenerator.createCommentOnCommentWithFields(
    post.id,
    parentComment.id,
    userVlad,
    requestContent,
  );

  expect(comment.blockchain_id).toBe(blockchain_id);

  const eventId = NotificationsEventIdDictionary.getUserCommentsComment();

  const activity = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeComment(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from:       userVlad.id,
      entity_id_to:       comment.id,
      entity_name:        EntityNames.COMMENTS,
      event_id:           eventId,
      entity_id_on:       parentComment.id,
      entity_name_on:     EntityNames.COMMENTS,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activity);

  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('create comment for post from organization and provide a transaction', async () => {
  const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);
  const post: PostModel = await PostsGenerator.createMediaPostOfOrganizationAndGetModel(userVlad, organization.id);

  const commentContent = {
    description:    'New comment description',
    entity_images:  '{}',
  };

  const isReply = false;

  const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateCommentFromOrganization(
    userVlad.account_name,
    userVlad.private_key,
    post.blockchain_id,
    organization.blockchain_id,
    commentContent,
    isReply,
  );

  const requestContent: StringToAnyCollection = {
    ...commentContent,
    signed_transaction,
    blockchain_id,
  };

  const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(post.id, userVlad, requestContent);

  expect(comment.blockchain_id).toBe(blockchain_id);

  const activities = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeComment(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreationByOrganization(),
      user_id_from:       userVlad.id,
      entity_id_to:       comment.id,
      entity_name:        EntityNames.COMMENTS,
      entity_id_on:       post.id,
      entity_name_on:     EntityNames.POSTS,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activities);

  await UsersActivityCommonHelper.getProcessedActivityById(activities[0].id);
}, JEST_TIMEOUT);

it('create comment for comment from organization and provide a transaction', async () => {
  const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);
  const post: PostModel = await PostsGenerator.createMediaPostOfOrganizationAndGetModel(userVlad, organization.id);

  const parentComment: CommentModel =
    await CommentsGenerator.createCommentForPostWithField(post.id, userJane);

  const commentContent = {
    description:    'New comment description',
    entity_images:  '{}',
  };

  const isReply = true;

  const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateCommentFromOrganization(
    userVlad.account_name,
    userVlad.private_key,
    parentComment.blockchain_id,
    organization.blockchain_id,
    commentContent,
    isReply,
  );

  const requestContent: StringToAnyCollection = {
    ...commentContent,
    signed_transaction,
    blockchain_id,
  };

  const comment: CommentModel = await CommentsGenerator.createCommentOnCommentWithFields(
    post.id,
    parentComment.id,
    userVlad,
    requestContent,
  );

  expect(comment.blockchain_id).toBe(blockchain_id);

  const activities = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeComment(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreationByOrganization(),
      user_id_from:       userVlad.id,
      entity_id_to:       comment.id,
      entity_name:        EntityNames.COMMENTS,
      entity_id_on:       parentComment.id,
      entity_name_on:     EntityNames.COMMENTS,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activities);

  await UsersActivityCommonHelper.getProcessedActivityById(activities[0].id);
}, JEST_TIMEOUT_DEBUG);

it.skip('resend comments - historical transactions', async () => {
  // resend comments of organization post

  const organizationId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
  const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, organizationId);

  const postComment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);
  await CommentsGenerator.createCommentOnCommentWithFields(postId, postComment.id, userJane);

  await CommentsResendingService.resendComments('2019-11-11', 2, true);
}, JEST_TIMEOUT_DEBUG);

export {};
