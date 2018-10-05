const request = require('supertest');
const server = require('../../../app');
const reqlib = require('app-root-path').require;

const helpers = require('../helpers');

const UserHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const CommentsRepository = reqlib('/lib/comments/comments-repository');
const CommentsHelper = require('../helpers/comments-helper');
const PostHelper = require('../helpers/posts-helper');
const ActivityUserCommentRepository = require('../../../lib/activity/activity-user-comment-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');

let userVlad, userJane, userPetr;


helpers.EosTransaction.mockCommentTransactionSigning();
helpers.EosTransaction.mockPostTransactionSigning();
helpers.EosTransaction.mockSendingToBlockchain();


describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => { await SeedsHelper.initCommentSeeds(); });
  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  describe('General tests about voting activity', () => {
    describe('Positive scenarios', () => {
      it('should be myself data about comments in post comments list', async () => {
        const post_id = 1;

        const commentToUpvote = await CommentsHelper.requestToCreateComment(post_id, userJane);
        await CommentsHelper.requestToUpvoteComment(post_id, commentToUpvote.id, userVlad);

        const commentToDownvote = await CommentsHelper.requestToCreateComment(post_id, userPetr);
        await CommentsHelper.requestToDownvoteComment(post_id, commentToDownvote.id, userVlad);


        const post = await PostHelper.requestToGetOnePostAsMyself(post_id, userVlad);
        const comments = post['comments'];

        const upvotedCommentOne = comments.find(comment => comment.id === commentToUpvote.id);
        expect(upvotedCommentOne.myselfData).toBeDefined();
        expect(upvotedCommentOne.myselfData.myselfVote).toBe('upvote');

        const upvotedCommentTwo = comments.find(comment => comment.id === commentToDownvote.id);
        expect(upvotedCommentTwo.myselfData).toBeDefined();
        expect(upvotedCommentTwo.myselfData.myselfVote).toBe('downvote');

        const notUpvotedComment = comments.find(comment => ![commentToUpvote.id, commentToDownvote.id].includes(comment.id));
        expect(notUpvotedComment.myselfData).toBeDefined();
        expect(notUpvotedComment.myselfData.myselfVote).toBe('no_vote');
      });
      it('should be no myself data if no auth token', async () => {
        const post_id = 1;

        const post = await PostHelper.requestToGetOnePostAsGuest(post_id);
        const comments = post['comments'];

        comments.forEach(comment => {
          expect(comment.myselfData).not.toBeDefined();
        });
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible for user to downvote if user has already upvoted', async () => {
        const post_id = 1;
        const comment_id = 1;

        await CommentsHelper.requestToUpvoteComment(post_id, comment_id, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });

      it('Not possible to upvote if downvote already', async () => {
        const post_id = 1;
        const comment_id = 1;

        await CommentsHelper.requestToDownvoteComment(post_id, comment_id, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });
    });
  });

  describe('User upvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User upvotes comment', async () => {
        const post_id = 1;
        const newComment = await CommentsHelper.requestToCreateComment(post_id, userJane);

        const comment_id = newComment.id;

        const votesBefore = await CommentsRepository.getCommentCurrentVote(comment_id);

        const body = await CommentsHelper.requestToUpvoteComment(post_id, comment_id, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore + 1);

        const userActivity = await ActivityUserCommentRepository.getUserCommentUpvote(userVlad.id, comment_id);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(ActivityDictionary.getUpvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(comment_id);

        const votesAfter = await CommentsRepository.getCommentCurrentVote(comment_id);

        expect(votesAfter).toBe(votesBefore + 1);

        expect(userActivity.blockchain_status).toBe(10);
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to upvote without auth token', async () => {
        const post_id = 1;
        const comment_id = 1;

        const res = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/upvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });


      it('should not be possible to upvote twice', async () => {
        const post_id = 1;
        const comment_id = 1;

        await CommentsHelper.requestToUpvoteComment(post_id, comment_id, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/upvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to upvote own comment', async () => {
        const post_id = 1;
        const newComment = await CommentsHelper.requestToCreateComment(post_id, userVlad);

          const res = await request(server)
            .post(`/api/v1/posts/${post_id}/comments/${newComment.id}/upvote`)
            .set('Authorization', `Bearer ${userVlad.token}`)
          ;

          ResponseHelper.expectStatusBadRequest(res);
      })
    });
  });

  describe('User downvotes comment', () => {
    describe('Positive scenarios', () => {
      it('User downvotes comment', async () => {
        const post_id = 1;
        const newComment = await CommentsHelper.requestToCreateComment(post_id, userJane);

        const comment_id = newComment.id;

        const votesBefore = await CommentsRepository.getCommentCurrentVote(comment_id);

        const body = await CommentsHelper.requestToDownvoteComment(post_id, comment_id, userVlad);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(votesBefore - 1);

        const userActivity = await ActivityUserCommentRepository.getUserCommentDownvote(userVlad.id, comment_id);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(ActivityDictionary.getDownvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(comment_id);

        const votesAfter = await CommentsRepository.getCommentCurrentVote(comment_id);

        expect(votesAfter).toBe(votesBefore - 1);

        expect(userActivity.blockchain_status).toBe(10);
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to downvote without auth token', async () => {
        const post_id = 1;
        const comment_id = 1;

        const res = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/downvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });


      it('should not be possible to downvote twice', async () => {
        const post_id = 1;
        const comment_id = 1;

        await CommentsHelper.requestToDownvoteComment(post_id, comment_id, userVlad);

        const resTwo = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${comment_id}/downvote`)
          .set('Authorization', `Bearer ${userPetr.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(resTwo);
      });

      it('should not be possible to downvote own comment', async () => {
        const post_id = 1;
        const newComment = await CommentsHelper.requestToCreateComment(post_id, userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${post_id}/comments/${newComment.id}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, 10000)
    });
  });
});