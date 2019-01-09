const helpers = require('../helpers');
const gen     = require('../../generators');

const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const PostRepository = require('../../../lib/posts/posts-repository');

const EventIdDictionary = require('../../../lib/entities/dictionary').EventId;

const PostsService = require('../../../lib/posts/repository').Main;

let userVlad, userJane, userPetr;

helpers.Mock.mockAllTransactionSigning();

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
      it.skip('Jane joins Vlad post', async () => {
        // const vladPost = await PostOfferRepository.findLastByAuthor(userVlad.id);
        //
        // const res = await request(server)
        //   .post(helpers.Req.getJoinUrl(vladPost.id))
        //   .set('Authorization', `Bearer ${userJane.token}`)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
        //
        // expect(res.body['post_id']).toBe(vladPost.id);
        //
        // const activity = await ActivityUserPostRepository.getUserPostJoin(userJane.id, vladPost.id);
        //
        // expect(activity).toBeDefined();
        //
        // expect(activity.user_id_from).toBe(userJane.id);
        // expect(activity.post_id_to).toBe(vladPost.id);
        // expect(activity.activity_type_id).toBe(InteractionTypeDictionary.getJoinId());
      });

      it.skip('There is a myselfData join for joined post', async () => {
        // TODO
      });

    });
  });

  it('List of posts contain different myself data related to users activity', async () => {

    // TODO - add more disturbance
    const targetUserId = userJane.id;

    const postIdToUpvote    = await PostRepository.findFirstMediaPostIdUserId(targetUserId);
    const postIdToDownvote  = await PostRepository.findLastMediaPostIdUserId(targetUserId);

    const postIdToNoVote    = await gen.Posts.createMediaPostByUserHimself(userJane);
    await gen.Posts.createRepostOfUserPost(userVlad, postIdToNoVote);

    await helpers.Posts.requestToUpvotePost(userVlad, postIdToUpvote);
    await helpers.Posts.requestToDownvotePost(userVlad, postIdToDownvote);
    await helpers.Posts.requestToUpvotePost(userPetr, postIdToUpvote); // disturbance

    const res = await request(server)
      .get(helpers.Req.getPostsUrl() + '?post_type_id=1')
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

        const activity = await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(EventIdDictionary.getUserUpvotesPostOfOrg());
      });

      it('Jane upvotes Vlad posts', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);

        const body = await helpers.PostHelper.requestToUpvotePost(userJane, postId);
        expect(body.current_vote).toBe(1);

        // noinspection JSCheckFunctionSignatures

        const changedPost = await PostRepository.findOneById(postId);

        expect(changedPost.current_vote).toBe(1);

        const activity = await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(+activity.entity_id_to).toBe(+postId);
        expect(activity.event_id).toBe(EventIdDictionary.getUserUpvotesPostOfOtherUser());
      });

      it.skip('should create valid users_activity record', async () => {
        // TODO
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
        const whoVotes = userJane;

        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);

        const body = await helpers.PostHelper.requestToDownvotePost(whoVotes, postId);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(-1);

        const postVoteAfter = await PostRepository.getPostCurrentVote(postId);
        expect(postVoteAfter).toBe(-1);

        const usersActivity = await UsersActivityRepository.findLastByUserIdAndEntityId(whoVotes.id, postId);
        expect(+usersActivity.entity_id_to).toBe(+postId);
        expect(usersActivity.event_id).toBe(EventIdDictionary.getUserDownvotesPostOfOtherUser());
      });

      it('Jane DOWNVOTE organization post of Vlad', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        await helpers.PostHelper.requestToDownvotePost(userJane, postId);

        const activity = await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(EventIdDictionary.getUserDownvotesPostOfOrg());
      });

      it.skip('should create valid users_activity record', async () => {
        // TODO
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

  describe('Negative scenarios', () => {
    it.skip('Not possible to join media post', async () => {
      // TODO
    });

    it.skip('Not possible to upvote twice', async () => {
      // TODO
      const posts = await PostsService.findAllByAuthor(userVlad.id);
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

    it.skip('Not possible to join to myself post', async () => {
      // TODO
      const posts = await PostsService.findAllByAuthor(userVlad.id);
      const postId = posts[0]['id'];

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });


    it.skip('Should return 400 if postID is not a valid integer', async () => {
      // TODO
      const postId = 'invalidPostId';
      const userJane = await UserHelper.getUserJane();

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });

    it.skip('Should return 404 if on post with provided ID', async () => {
      // TODO
      const postId = '100500';
      const userJane = await UserHelper.getUserJane();

      const res = await request(server)
        .post(`/api/v1/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userJane.token}`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it.skip('Not possible to follow without auth token', async () => {
      // TODO
      const res = await request(server)
        .post('/api/v1/posts/1/upvote')
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });
  })
});