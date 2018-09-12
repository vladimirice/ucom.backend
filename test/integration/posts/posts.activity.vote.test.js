const helpers = require('../helpers');

const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserPostRepository = require('../../../lib/activity/activity-user-post-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');
const PostRepository = require('../../../lib/posts/posts-repository');

let userVlad, userJane, userPetr;

describe('User to user activity', () => {
  beforeEach(async () => { await SeedsHelper.initSeeds(); });
  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr()
    ]);
  });

  describe('Upvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane upvotes Vlad posts', async () => {

        const userVlad = await UserHelper.getUserVlad();

        // noinspection JSCheckFunctionSignatures
        const [userJane, posts] = await Promise.all([
          UserHelper.getUserJane(),
          PostRepository.findAllByAuthor(userVlad.id)
        ]);

        const postId = posts[0]['id'];

        const postVotesBefore = posts[0].current_vote;

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusOk(res);

        // noinspection JSCheckFunctionSignatures
        const [ userUpvote, changedPost ]= await Promise.all([
          ActivityUserPostRepository.getUserPostUpvote(userJane.id, postId),
          PostRepository.findOneById(postId)
        ]);

        expect(userUpvote).toBeDefined();

        expect(userUpvote.user_id_from).toBe(userJane.id);
        expect(userUpvote.post_id_to).toBe(postId);
        expect(userUpvote.activity_type_id).toBe(ActivityDictionary.getUpvoteId());

        expect(changedPost['current_vote']).toBe(postVotesBefore + 1);
        expect(res.body['current_vote']).toBe(postVotesBefore + 1);
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to upvote twice', async () => {
        const posts = await PostRepository.findAllByAuthor(userVlad.id);
        const postId = posts[0]['id'];

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusOk(res);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(responseTwo);
      });
      it('Not possible to vote by myself post', async () => {
        const posts = await PostRepository.findAllByAuthor(userVlad.id);
        const postId = posts[0]['id'];

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';
        const userJane = await UserHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';
        const userJane = await UserHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const res = await request(server)
          .post('/api/v1/posts/1/upvote')
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Downvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane downvotes post', async () => {
        const whoVotes = userPetr;

        const post_id = 1;
        const postVoteBefore = await PostRepository.getPostCurrentVote(post_id);

        const body = await helpers.PostHelper.requestToDownvotePost(whoVotes, post_id);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(postVoteBefore - 1);

        const postVoteAfter = await PostRepository.getPostCurrentVote(post_id);
        expect(postVoteAfter).toBe(postVoteBefore - 1);

        const activity = await ActivityUserPostRepository.getUserPostDownvote(whoVotes.id, post_id);
        expect(activity).toBeDefined();

        expect(activity.user_id_from).toBe(whoVotes.id);
        expect(activity.post_id_to).toBe(post_id);
        expect(activity.activity_type_id).toBe(ActivityDictionary.getDownvoteId());

        expect(activity.blockchain_status).toBe(10);
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to upvote twice', async () => {
        // const posts = await PostRepository.findAllByAuthor(userVlad.id);
        // const postId = posts[0]['id'];
        //
        // const res = await request(server)
        //   .post(`/api/v1/posts/${postId}/upvote`)
        //   .set('Authorization', `Bearer ${userJane.token}`)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
        //
        // const responseTwo = await request(server)
        //   .post(`/api/v1/posts/${postId}/upvote`)
        //   .set('Authorization', `Bearer ${userJane.token}`)
        // ;
        //
        // ResponseHelper.expectStatusBadRequest(responseTwo);
      });
      it('Not possible to vote by myself post', async () => {
        // const posts = await PostRepository.findAllByAuthor(userVlad.id);
        // const postId = posts[0]['id'];
        //
        // const res = await request(server)
        //   .post(`/api/v1/posts/${postId}/upvote`)
        //   .set('Authorization', `Bearer ${userVlad.token}`)
        // ;
        //
        // ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 400 if postID is not a valid integer', async () => {
        // const postId = 'invalidPostId';
        // const userJane = await UserHelper.getUserJane();
        //
        // const res = await request(server)
        //   .post(`/api/v1/posts/${postId}/upvote`)
        //   .set('Authorization', `Bearer ${userJane.token}`)
        // ;
        //
        // ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        // const postId = '100500';
        // const userJane = await UserHelper.getUserJane();
        //
        // const res = await request(server)
        //   .post(`/api/v1/posts/${postId}/upvote`)
        //   .set('Authorization', `Bearer ${userJane.token}`)
        // ;
        //
        // ResponseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        // const res = await request(server)
        //   .post('/api/v1/posts/1/upvote')
        // ;
        //
        // ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });
});