import CommentsGenerator = require('../../generators/comments-generator');
import PostsGenerator = require('../../generators/posts-generator');
import RequestHelper = require('../helpers/request-helper');

const request = require('supertest');

const server = RequestHelper.getApiApplication();
const gen = require('../../generators');

const helpers = require('../helpers');

const userHelper = require('../helpers/users-helper');
const seedsHelper = require('../helpers/seeds-helper');
const responseHelper = require('../helpers/response-helper');
const commentsRepository = require('../../../lib/comments/comments-repository');
const commentsHelper = require('../helpers/comments-helper');
const postHelper = require('../helpers/posts-helper');
const activityUserCommentRepository =
  require('../../../lib/activity/activity-user-comment-repository');
const activityDictionary = require('../../../lib/activity/activity-types-dictionary');

const eventIdDictionary = require('../../../lib/entities/dictionary').EventId;

const usersActivityRepository = require('../../../lib/users/repository').Activity;

let userVlad;
let userJane;
let userPetr;

helpers.Mock.mockAllTransactionSigning();

const JEST_TIMEOUT = 10000;

describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
      userHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => { await seedsHelper.initCommentSeeds(); });
  afterAll(async () => { await seedsHelper.sequelizeAfterAll(); });

  describe('General tests about voting activity', () => {
    describe('Positive scenarios', () => {
      it('should be myself data about comments in post comments list', async () => {
        const postId = 1;

        const commentToUpvote = await CommentsGenerator.createCommentForPost(postId, userJane);
        await commentsHelper.requestToUpvoteComment(postId, commentToUpvote.id, userVlad);

        const commentToDownvote = await CommentsGenerator.createCommentForPost(postId, userPetr);
        await commentsHelper.requestToDownvoteComment(postId, commentToDownvote.id, userVlad);

        const post = await postHelper.requestToGetOnePostAsMyself(postId, userVlad);
        const { comments } = post;

        const upvotedCommentOne = comments.find(comment => comment.id === commentToUpvote.id);
        expect(upvotedCommentOne.myselfData).toBeDefined();
        expect(upvotedCommentOne.myselfData.myselfVote).toBe('upvote');

        const upvotedCommentTwo = comments.find(comment => comment.id === commentToDownvote.id);
        expect(upvotedCommentTwo.myselfData).toBeDefined();
        expect(upvotedCommentTwo.myselfData.myselfVote).toBe('downvote');

        const notUpvotedComment = comments.find(
          // @ts-ignore
          comment => ![commentToUpvote.id, commentToDownvote.id].includes(comment.id),
        );
        expect(notUpvotedComment.myselfData).toBeDefined();
        expect(notUpvotedComment.myselfData.myselfVote).toBe('no_vote');
      }, JEST_TIMEOUT);
      it('should be no myself data if no auth token', async () => {
        const postId = 1;

        const post = await postHelper.requestToGetOnePostAsGuest(postId);
        const { comments } = post;

        comments.forEach((comment) => {
          expect(comment.myselfData).not.toBeDefined();
        });
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible for user to downvote if user has already upvoted', async () => {
        const postId = 1;
        const commentId = 1;

        await commentsHelper.requestToUpvoteComment(postId, commentId, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        responseHelper.expectStatusBadRequest(resTwo);
      });

      it('Not possible to upvote if downvote already', async () => {
        const postId = 1;
        const commentId = 1;

        await commentsHelper.requestToDownvoteComment(postId, commentId, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        responseHelper.expectStatusBadRequest(resTwo);
      });
    });
  });

  describe('User upvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User upvotes comment', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const newComment = await gen.Comments.createCommentForPost(postId, userJane);

        const commentId = newComment.id;

        const votesBefore = await commentsRepository.getCommentCurrentVote(commentId);

        const body = await commentsHelper.requestToUpvoteComment(postId, commentId, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore + 1);

        const userActivity =
          await activityUserCommentRepository.getUserCommentUpvote(userVlad.id, commentId);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(activityDictionary.getUpvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(commentId);

        const votesAfter = await commentsRepository.getCommentCurrentVote(commentId);

        expect(votesAfter).toBe(votesBefore + 1);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newComment.id);
        expect(activity.event_id).toBe(eventIdDictionary.getUserUpvotesCommentOfOtherUser());
      });

      it('User upvotes comment of organization', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await commentsHelper.requestToUpvoteComment(postId, comment.id, userJane);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userJane.id, comment.id);
        expect(activity.event_id).toBe(eventIdDictionary.getUserUpvotesCommentOfOrg());
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to upvote without auth token', async () => {
        const postId = 1;
        const commentId = 1;

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/upvote`)
        ;

        responseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to upvote twice', async () => {
        const postId = 1;
        const commentId = 1;

        await commentsHelper.requestToUpvoteComment(postId, commentId, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        responseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to upvote own comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userJane);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${newComment.id}/upvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      }, 10000);
    });
  });

  describe('User downvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User DOWNVOTES comment', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const newComment = await gen.Comments.createCommentForPost(postId, userJane);

        const commentId = newComment.id;

        const votesBefore = await commentsRepository.getCommentCurrentVote(commentId);

        const body = await commentsHelper.requestToDownvoteComment(postId, commentId, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore - 1);

        const userActivity =
          await activityUserCommentRepository.getUserCommentDownvote(userVlad.id, commentId);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(activityDictionary.getDownvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(commentId);

        const votesAfter = await commentsRepository.getCommentCurrentVote(commentId);

        expect(votesAfter).toBe(votesBefore - 1);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newComment.id);
        expect(activity.event_id).toBe(eventIdDictionary.getUserDownvotesCommentOfOtherUser());
      }, 10000);

      it('User DOWNVOTES comment of ORG', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await commentsHelper.requestToDownvoteComment(postId, comment.id, userJane);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userJane.id, comment.id);
        expect(activity.event_id).toBe(eventIdDictionary.getUserDownvotesCommentOfOrg());
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to downvote without auth token', async () => {
        const postId = 1;
        const commentId = 1;

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/downvote`)
        ;

        responseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to downvote twice', async () => {
        const postId = 1;
        const commentId = 1;

        await commentsHelper.requestToDownvoteComment(postId, commentId, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${commentId}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        responseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to downvote own comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const newComment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/comments/${newComment.id}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      }, 10000);
    });
  });
});

export {};
