const helpers = require('../helpers');

const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserPostRepository = require('../../../lib/activity/activity-user-post-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');
const PostRepository = require('../../../lib/posts/posts-repository');
const PostOfferRepository = require('../../../lib/posts/repository').PostOffer;

let userVlad, userJane, userPetr;

describe('User to post activity', () => {
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

  describe('User to post JOIN activity', () => {
    describe('Positive scenarios', () => {
      it('Jane joins Vlad post', async () => {
        const vladPost = await PostOfferRepository.findLastByAuthor(userVlad.id);

        const res = await request(server)
          .post(helpers.Req.getJoinUrl(vladPost.id))
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusOk(res);

        expect(res.body['post_id']).toBe(vladPost.id);

        const activity = await ActivityUserPostRepository.getUserPostJoin(userJane.id, vladPost.id);

        expect(activity).toBeDefined();

        expect(activity.user_id_from).toBe(userJane.id);
        expect(activity.post_id_to).toBe(vladPost.id);
        expect(activity.activity_type_id).toBe(ActivityDictionary.getJoinId());
      });

      // it('There is a myselfData join for joined post', async () => {
      //   // TODO
      // });

    });

    describe('Negative scenarios', () => {
      // it('Not possible to join media post', async () => {
      //   // TODO
      // });

      // it('Not possible to upvote twice', async () => {
      //   const posts = await PostService.findAllByAuthor(userVlad.id);
      //   const postId = posts[0]['id'];
      //
      //   const res = await request(server)
      //     .post(`/api/v1/posts/${postId}/upvote`)
      //     .set('Authorization', `Bearer ${userJane.token}`)
      //   ;
      //
      //   ResponseHelper.expectStatusOk(res);
      //
      //   const responseTwo = await request(server)
      //     .post(`/api/v1/posts/${postId}/upvote`)
      //     .set('Authorization', `Bearer ${userJane.token}`)
      //   ;
      //
      //   ResponseHelper.expectStatusBadRequest(responseTwo);
      // });

      // it('Not possible to join to myself post', async () => {
      //   const posts = await PostService.findAllByAuthor(userVlad.id);
      //   const postId = posts[0]['id'];
      //
      //   const res = await request(server)
      //     .post(`/api/v1/posts/${postId}/upvote`)
      //     .set('Authorization', `Bearer ${userVlad.token}`)
      //   ;
      //
      //   ResponseHelper.expectStatusBadRequest(res);
      // });


      // it('Should return 400 if postID is not a valid integer', async () => {
      //   const postId = 'invalidPostId';
      //   const userJane = await UserHelper.getUserJane();
      //
      //   const res = await request(server)
      //     .post(`/api/v1/posts/${postId}/upvote`)
      //     .set('Authorization', `Bearer ${userJane.token}`)
      //   ;
      //
      //   ResponseHelper.expectStatusBadRequest(res);
      // });

      // it('Should return 404 if on post with provided ID', async () => {
      //   const postId = '100500';
      //   const userJane = await UserHelper.getUserJane();
      //
      //   const res = await request(server)
      //     .post(`/api/v1/posts/${postId}/upvote`)
      //     .set('Authorization', `Bearer ${userJane.token}`)
      //   ;
      //
      //   ResponseHelper.expectStatusNotFound(res);
      // });

      // it('Not possible to follow without auth token', async () => {
      //   const res = await request(server)
      //     .post('/api/v1/posts/1/upvote')
      //   ;
      //
      //   ResponseHelper.expectStatusUnauthorized(res);
      // });
    })
  });

  it('List of posts contain different myself data related to users activity', async () => {

    // TODO - add more disturbance
    const targetUserId = userJane.id;

    const postIdToUpvote    = await PostRepository.findFirstMediaPostIdUserId(targetUserId);
    const postIdToDownvote  = await PostRepository.findLastMediaPostIdUserId(targetUserId);

    const janePostOfferId = await helpers.Post.requestToCreatePostOffer(userJane);

    await request(server)
      .post(helpers.Req.getJoinUrl(janePostOfferId))
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    await helpers.Posts.requestToUpvotePost(userVlad, postIdToUpvote);
    await helpers.Posts.requestToDownvotePost(userVlad, postIdToDownvote);
    await helpers.Posts.requestToUpvotePost(userPetr, postIdToUpvote); // disturbance

    const res = await request(server)
      .get(helpers.Req.getPostsUrl())
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    const posts = res.body.data;

    const upvotedPost = posts.find(post => post.id === postIdToUpvote);
    expect(upvotedPost.myselfData).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBe('upvote');

    const downvotedPost = posts.find(post => post.id === postIdToDownvote);
    expect(downvotedPost.myselfData.myselfVote).toBe('downvote');


    const joinedPost = posts.find(post => post.id === janePostOfferId);

    expect(joinedPost.myselfData.join).toBeTruthy();
  }, 10000);

  describe('Upvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane upvotes Vlad posts', async () => {

        const post = await PostRepository.findLastMediaPostByAuthor(userVlad.id);

        const postVotesBefore = post.current_vote;

        const body = await helpers.PostHelper.requestToUpvotePost(userJane, post.id);
        expect(body['current_vote']).toBe(postVotesBefore + 1);

        // noinspection JSCheckFunctionSignatures
        const [ userUpvote, changedPost ]= await Promise.all([
          ActivityUserPostRepository.getUserPostUpvote(userJane.id, post.id),
          PostRepository.findOneById(post.id)
        ]);

        expect(changedPost['current_vote']).toBe(postVotesBefore + 1);

        expect(userUpvote).toBeDefined();

        expect(userUpvote.user_id_from).toBe(userJane.id);
        expect(userUpvote.post_id_to).toBe(post.id);
        expect(userUpvote.activity_type_id).toBe(ActivityDictionary.getUpvoteId());
        expect(+userUpvote.blockchain_status).toBe(10);
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to vote twice', async () => {
        const post = await PostRepository.findLastMediaPostByAuthor(userVlad.id);

        await helpers.PostHelper.requestToUpvotePost(userJane, post.id);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${post.id}/upvote`)
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

        expect(+activity.blockchain_status).toBe(10);
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to downvote twice', async () => {
        const post = await PostRepository.findLastMediaPostByAuthor(userVlad.id);
        const whoVotes = userJane;

        await helpers.PostHelper.requestToDownvotePost(whoVotes, post.id);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${post.id}/downvote`)
          .set('Authorization', `Bearer ${whoVotes.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(responseTwo);
      });
      it('Not possible to vote by myself post', async () => {
        const post = await PostRepository.findLastMediaPostByAuthor(userVlad.id);

        const res = await request(server)
          .post(`/api/v1/posts/${post.id}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';
        const userJane = await UserHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';
        const userJane = await UserHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const res = await request(server)
          .post('/api/v1/posts/1/downvote')
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });
});