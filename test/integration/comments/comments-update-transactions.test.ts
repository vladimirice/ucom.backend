import { EventsIdsDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CommentModel } from '../../../lib/comments/interfaces/model-interfaces';
import { PostModel } from '../../../lib/posts/interfaces/model-interfaces';
import { OrgModel } from '../../../lib/organizations/interfaces/model-interfaces';

const { PublicationsApi } = require('ucom-libs-wallet').Content;

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');

import CommentsGenerator = require('../../generators/comments-generator');
import CommentsHelper = require('../helpers/comments-helper');

import OrganizationsGenerator = require('../../generators/organizations-generator');

import UsersActivityCommonHelper = require('../../helpers/users/activity/users-activity-common-helper');

let userVlad: UserModel;

beforeAll(async () =>   { await SeedsHelper.noGraphQlNoMocking(); });
afterAll(async () =>    { await SeedsHelper.afterAllWithoutGraphQl(); });
beforeEach(async () =>  { [userVlad] = await SeedsHelper.beforeAllRoutine(); });

const JEST_TIMEOUT = 10000;

describe('Update comment or reply from user with a real transaction', () => {
  it('should update comment', async () => {
    const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userVlad);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(post.id, userVlad);

    const description = 'Updated description';

    const isReply = false;
    const signed_transaction = await PublicationsApi.signUpdateCommentFromAccount(
      userVlad.account_name,
      userVlad.social_private_key,
      post.blockchain_id,
      {
        ...comment,
        description,
      },
      comment.blockchain_id,
      isReply,
      'social',
    );

    const updateFields = {
      signed_transaction,
      description,
    };

    await CommentsHelper.updateCommentForPostWithField(comment.id, userVlad, updateFields);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromAccount();

    await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
  }, JEST_TIMEOUT);

  it('should update comment on comment', async () => {
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad);

    const commentOnComment: CommentModel =
      await CommentsGenerator.createCommentOnCommentWithFields(postId, comment.id, userVlad);

    const description = 'Updated description';

    const isReply = true;

    const signed_transaction = await PublicationsApi.signUpdateCommentFromAccount(
      userVlad.account_name,
      userVlad.social_private_key,
      comment.blockchain_id,
      {
        ...commentOnComment,
        description,
      },
      commentOnComment.blockchain_id,
      isReply,
      'social',
    );

    const updateFields = {
      signed_transaction,
      description,
    };

    await CommentsHelper.updateCommentForPostWithField(commentOnComment.id, userVlad, updateFields);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromAccount();
    await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
  }, JEST_TIMEOUT);
});

describe('Update comment or reply from organization with a real transaction', () => {
  it('should update comment', async () => {
    const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);
    const post: PostModel = await PostsGenerator.createMediaPostOfOrganizationAndGetModel(userVlad, organization.id);

    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(post.id, userVlad);

    const description = 'Updated description';

    const isReply = false;
    const signed_transaction = await PublicationsApi.signUpdateCommentFromOrganization(
      userVlad.account_name,
      userVlad.social_private_key,
      post.blockchain_id,
      organization.blockchain_id,
      {
        ...comment,
        description,
      },
      comment.blockchain_id,
      isReply,
      'social',
    );


    const updateFields = {
      description,
      signed_transaction,
    };

    await CommentsHelper.updateCommentForPostWithField(comment.id, userVlad, updateFields);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromOrganization();
    await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
  }, JEST_TIMEOUT);

  it('should update comment on comment', async () => {
    const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, organization.id);

    const description = 'Updated description';
    const comment: CommentModel = await CommentsGenerator.createCommentForPostWithField(postId, userVlad, {
      blockchain_id: 'parent_comment_blockchain_id',
      description: 'hello @janejanejane',
    });

    const commentOnComment: CommentModel =
      await CommentsGenerator.createCommentOnCommentWithFields(postId, comment.id, userVlad, {
        blockchain_id: 'comment_on_comment_blockchain_id',
      });

    const isReply = true;
    const signed_transaction = await PublicationsApi.signUpdateCommentFromOrganization(
      userVlad.account_name,
      userVlad.social_private_key,
      comment.blockchain_id,
      organization.blockchain_id,
      {
        ...commentOnComment,
        description,
      },
      commentOnComment.blockchain_id,
      isReply,
      'social',
    );

    const updateFields = {
      signed_transaction,
      description,
    };

    await CommentsHelper.updateCommentForPostWithField(commentOnComment.id, userVlad, updateFields);

    const eventId = EventsIdsDictionary.userUpdatesCommentFromOrganization();
    await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
  }, JEST_TIMEOUT);
});
