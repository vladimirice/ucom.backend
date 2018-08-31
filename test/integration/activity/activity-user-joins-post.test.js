const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserPostRepository = require('../../../lib/activity/activity-user-post-repository');
const PostService = require('../../../lib/posts/post-service');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');

let userVlad, userJane;

describe('User to post JOIN activity', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Positive scenarios', () => {
    it('Jane joins Vlad post', async () => {
      const vladPost = await PostService.findLastPostOfferByAuthor(userVlad.id);

      const res = await request(server)
        .post(RequestHelper.getJoinUrl(vladPost.id))
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