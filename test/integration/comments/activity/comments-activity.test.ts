import { EventsIdsDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import CommentsGenerator = require('../../../generators/comments-generator');
import PostsGenerator = require('../../../generators/posts-generator');
import RequestHelper = require('../../helpers/request-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import CommentsHelper = require('../../helpers/comments-helper');
import PostsHelper = require('../../helpers/posts-helper');
import ResponseHelper = require('../../helpers/response-helper');
import CommentsRepository = require('../../../../lib/comments/comments-repository');
import ActivityUserCommentRepository = require('../../../../lib/activity/activity-user-comment-repository');
import ActivityTypesDictionary = require('../../../../lib/activity/activity-types-dictionary');
import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import CommonChecker = require('../../../helpers/common/common-checker');
import CommentsModelProvider = require('../../../../lib/comments/service/comments-model-provider');

const { InteractionTypesDictionary } = require('ucom.libs.common');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const JEST_TIMEOUT = 20000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Comments', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
  });

  describe('General tests about voting activity', () => {
    describe('Positive scenarios', () => {
      it('should be myself data about comments in post comments list', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const commentToUpvote = await CommentsGenerator.createCommentForPost(postId, userJane);
        await CommentsHelper.requestToUpvoteComment(postId, commentToUpvote.id, userVlad);

        const commentToDownvote = await CommentsGenerator.createCommentForPost(postId, userPetr);
        await CommentsHelper.requestToDownvoteComment(postId, commentToDownvote.id, userVlad);

        const notUpvotedComment = await CommentsGenerator.createCommentForPost(postId, userJane);

        const post = await PostsHelper.requestToGetOnePostAsMyself(postId, userVlad);
        const { comments } = post;

        const upvotedCommentOne = comments.find((comment) => comment.id === commentToUpvote.id);
        expect(upvotedCommentOne.myselfData).toBeDefined();
        expect(upvotedCommentOne.myselfData.myselfVote).toBe('upvote');

        const upvotedCommentTwo = comments.find((comment) => comment.id === commentToDownvote.id);
        expect(upvotedCommentTwo.myselfData).toBeDefined();
        expect(upvotedCommentTwo.myselfData.myselfVote).toBe('downvote');

        expect(notUpvotedComment.myselfData).toBeDefined();
        expect(notUpvotedComment.myselfData.myselfVote).toBe('no_vote');
      }, JEST_TIMEOUT);
      it('should be no myself data if no auth token', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const post = await PostsHelper.requestToGetOnePostAsGuest(postId);
        const { comments } = post;

        comments.forEach((comment) => {
          expect(comment.myselfData).not.toBeDefined();
        });
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible for user to downvote if user has already upvoted', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userPetr);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      }, JEST_TIMEOUT);

      it('Not possible to upvote if downvote already', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userPetr);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      }, JEST_TIMEOUT);
    });
  });

  describe('User upvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User upvotes comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userJane);

        const commentId = newComment.id;

        const votesBefore = await CommentsRepository.getCommentCurrentVote(commentId);

        const body = await CommentsHelper.requestToUpvoteComment(postId, commentId, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore! + 1);

        const userActivity =
          await ActivityUserCommentRepository.getUserCommentUpvote(userVlad.id, commentId);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(ActivityTypesDictionary.getUpvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(commentId);

        const votesAfter = await CommentsRepository.getCommentCurrentVote(commentId);

        expect(votesAfter).toBe(votesBefore! + 1);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newComment.id);
        expect(activity.event_id).toBe(EventsIdsDictionary.getUserUpvotesCommentOfOtherUser());

        const indexRecord = await knex(UsersModelProvider.getUsersActivityVoteTableName())
          .where({
            entity_id: commentId,
            user_id: userVlad.id,
            interaction_type: InteractionTypesDictionary.getUpvoteId(),
            entity_name: CommentsModelProvider.getEntityName(),
          });

        CommonChecker.expectNotEmpty(indexRecord);
      }, JEST_TIMEOUT);

      it('User upvotes comment of organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userJane);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, comment.id);
        expect(activity.event_id).toBe(EventsIdsDictionary.getUserUpvotesCommentOfOrg());
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to upvote without auth token', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/upvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to upvote twice', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userPetr);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to upvote own comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userJane);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${newComment.id}/upvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);
    });
  });

  describe('User downvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User DOWNVOTES comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userJane);

        const commentId = newComment.id;

        const votesBefore = await CommentsRepository.getCommentCurrentVote(commentId);

        const body = await CommentsHelper.requestToDownvoteComment(postId, commentId, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore! - 1);

        const userActivity =
          await ActivityUserCommentRepository.getUserCommentDownvote(userVlad.id, commentId);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(ActivityTypesDictionary.getDownvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(commentId);

        const votesAfter = await CommentsRepository.getCommentCurrentVote(commentId);

        expect(votesAfter).toBe(votesBefore! - 1);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newComment.id);
        expect(activity.event_id).toBe(EventsIdsDictionary.getUserDownvotesCommentOfOtherUser());

        const indexRecord = await knex(UsersModelProvider.getUsersActivityVoteTableName())
          .where({
            entity_id: commentId,
            user_id: userVlad.id,
            interaction_type: InteractionTypesDictionary.getDownvoteId(),
            entity_name: CommentsModelProvider.getEntityName(),
          });

        CommonChecker.expectNotEmpty(indexRecord);
      }, JEST_TIMEOUT);

      it('User DOWNVOTES comment of ORG', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userJane);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, comment.id);
        expect(activity.event_id).toBe(EventsIdsDictionary.getUserDownvotesCommentOfOrg());
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to downvote without auth token', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/downvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to downvote twice', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userPetr);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${comment.id}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to downvote own comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${newComment.id}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);
    });
  });
});

export {};
