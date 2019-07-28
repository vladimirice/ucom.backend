import RequestHelper = require('../helpers/request-helper');

export {};

const request = require('supertest');
const helpers = require('../helpers');
const gen     = require('../../generators');

const server = RequestHelper.getApiApplication();
const userHelper = require('../helpers/users-helper');

const seedsHelper = require('../helpers/seeds-helper');
const responseHelper = require('../helpers/response-helper');
const usersActivityRepository = require('../../../lib/users/repository').Activity;
const postRepository = require('../../../lib/posts/posts-repository');

const eventIdDictionary = require('../../../lib/entities/dictionary').EventId;

const postsService = require('../../../lib/posts/repository').Main;

let userVlad;
let userJane;
let userPetr;

helpers.Mock.mockAllTransactionSigning();

const JEST_TIMEOUT = 10000;

describe('User to post activity', () => {
  beforeEach(async () => { await seedsHelper.initSeeds(); });
  afterAll(async () => { await seedsHelper.sequelizeAfterAll(); });

  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
      userHelper.getUserPetr(),
    ]);
  });

  describe('User to post JOIN activity', () => {
    describe('Positive scenarios', () => {
      it.skip('Jane joins Vlad post', async () => {
      });

      it.skip('There is a myselfData join for joined post', async () => {
      });
    });
  });

  it('List of posts contain different myself data related to users activity', async () => {
    const targetUserId = userJane.id;

    const postIdToUpvote    = await postRepository.findFirstMediaPostIdUserId(targetUserId);
    const postIdToDownvote  = await postRepository.findLastMediaPostIdUserId(targetUserId);

    const postIdToNoVote    = await gen.Posts.createMediaPostByUserHimself(userJane);
    await gen.Posts.createRepostOfUserPost(userVlad, postIdToNoVote);

    await helpers.Posts.requestToUpvotePost(userVlad, postIdToUpvote);
    await helpers.Posts.requestToDownvotePost(userVlad, postIdToDownvote);
    await helpers.Posts.requestToUpvotePost(userPetr, postIdToUpvote); // disturbance

    const res = await request(server)
      .get(`${helpers.Req.getPostsUrl()}?post_type_id=1`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    const posts = res.body.data;

    const postNoVote = posts.find(post => post.id === postIdToNoVote);
    expect(postNoVote.myselfData.myselfVote).toBe('no_vote');

    const upvotedPost = posts.find(post => post.id === postIdToUpvote);
    expect(upvotedPost.myselfData).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBe('upvote');

    const downvotedPost = posts.find(post => post.id === postIdToDownvote);
    expect(downvotedPost.myselfData.myselfVote).toBe('downvote');
  }, 10000);

  describe('Upvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane upvotes organization post of Vlad', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        await helpers.PostHelper.requestToUpvotePost(userJane, postId);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(eventIdDictionary.getUserUpvotesPostOfOrg());
      });

      it('Jane upvotes Vlad posts', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);

        const body = await helpers.PostHelper.requestToUpvotePost(userJane, postId);
        expect(body.current_vote).toBe(1);

        const changedPost = await postRepository.findOneById(postId);

        expect(changedPost.current_vote).toBe(1);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(+activity.entity_id_to).toBe(+postId);
        expect(activity.event_id).toBe(eventIdDictionary.getUserUpvotesPostOfOtherUser());
      });

      it.skip('should create valid users_activity record', async () => {
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible to vote twice', async () => {
        const post = await postRepository.findLastMediaPostByAuthor(userVlad.id);

        await helpers.PostHelper.requestToUpvotePost(userJane, post.id);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${post.id}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        responseHelper.expectStatusBadRequest(responseTwo);
      }, JEST_TIMEOUT);

      it('Not possible to vote by myself post', async () => {
        const posts = await postRepository.findAllByAuthor(userVlad.id);
        const postId = posts[0].id;

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);

      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';
        const userJane = await userHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';
        const userJane = await userHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        responseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const res = await request(server)
          .post('/api/v1/posts/1/upvote')
        ;

        responseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Downvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane downvotes post', async () => {
        const whoVotes = userJane;

        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);

        const body = await helpers.PostHelper.requestToDownvotePost(whoVotes, postId);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(-1);

        const postVoteAfter = await postRepository.getPostCurrentVote(postId);
        expect(postVoteAfter).toBe(-1);

        const usersActivity =
          await usersActivityRepository.findLastByUserIdAndEntityId(whoVotes.id, postId);
        expect(+usersActivity.entity_id_to).toBe(+postId);
        expect(usersActivity.event_id).toBe(eventIdDictionary.getUserDownvotesPostOfOtherUser());
      });

      it('Jane DOWNVOTE organization post of Vlad', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        await helpers.PostHelper.requestToDownvotePost(userJane, postId);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(eventIdDictionary.getUserDownvotesPostOfOrg());
      });

      it.skip('should create valid users_activity record', async () => {
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to downvote twice', async () => {
        const post = await postRepository.findLastMediaPostByAuthor(userVlad.id);
        const whoVotes = userJane;

        await helpers.PostHelper.requestToDownvotePost(whoVotes, post.id);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${post.id}/downvote`)
          .set('Authorization', `Bearer ${whoVotes.token}`)
        ;

        responseHelper.expectStatusBadRequest(responseTwo);
      }, JEST_TIMEOUT);

      it('Not possible to vote by myself post', async () => {
        const post = await postRepository.findLastMediaPostByAuthor(userVlad.id);

        const res = await request(server)
          .post(`/api/v1/posts/${post.id}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);
      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';
        const userJane = await userHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        responseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';
        const userJane = await userHelper.getUserJane();

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        responseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const res = await request(server)
          .post('/api/v1/posts/1/downvote')
        ;

        responseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Negative scenarios', () => {
    it.skip('Not possible to join media post', async () => {
    });

    it.skip('Not possible to upvote twice', async () => {
      const posts = await postsService.findAllByAuthor(userVlad.id);
      const postId = posts[0].id;

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      responseHelper.expectStatusOk(res);

      const responseTwo = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      responseHelper.expectStatusBadRequest(responseTwo);
    });

    it.skip('Not possible to join to myself post', async () => {
      const posts = await postsService.findAllByAuthor(userVlad.id);
      const postId = posts[0].id;

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      responseHelper.expectStatusBadRequest(res);
    });

    it.skip('Should return 400 if postID is not a valid integer', async () => {
      const postId = 'invalidPostId';
      const userJane = await userHelper.getUserJane();

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      responseHelper.expectStatusBadRequest(res);
    });

    it.skip('Should return 404 if on post with provided ID', async () => {
      const postId = '100500';
      const userJane = await userHelper.getUserJane();

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      responseHelper.expectStatusNotFound(res);
    });

    it.skip('Not possible to follow without auth token', async () => {
      const res = await request(server)
        .post('/api/v1/posts/1/upvote')
      ;

      responseHelper.expectStatusUnauthorized(res);
    });
  });
});
