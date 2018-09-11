const request = require('supertest');
const server = require('../../../app');
const reqlib = require('app-root-path').require;

const UserHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const CommentsRepository = reqlib('/lib/comments/comments-repository');
const CommentsHelper = require('../helpers/comments-helper');
const UserRepository = reqlib('/lib/users/users-repository');
const PostService = reqlib('/lib/posts/post-service');
const PostHelper = require('../helpers/posts-helper');
const ActivityUserCommentRepository = require('../../../lib/activity/activity-user-comment-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');

let userVlad, userJane;

describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initCommentSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('User upvotes comment', () => {

    describe('Positive scenarios', () => {
      it('User upvotes comment', async () => {
        const post_id = 1;
        const comment_id = 1;

        const res = await CommentsHelper.requestToUpvotePost(post_id, comment_id, userVlad);


        const userActivity = await ActivityUserCommentRepository.getUserCommentUpvote(userVlad.id, comment_id);

        expect(userActivity).not.toBeNull();

        expect(userActivity.activity_type_id).toBe(ActivityDictionary.getUpvoteId());
        expect(userActivity.user_id_from).toBe(userVlad.id);
        expect(userActivity.comment_id_to).toBe(comment_id);
        // expect(userActivity.blockchain_status).toBe(10); // TODO

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
        // TODO
      });
      it('should not be possible to upvote own comment', async () => {
        // TODO
      })
    });
  });

  /*

  * User upvotes comment like a post
  * Comment has vote counter but in stats table not in main table because it is stats.
  * Comment has myself data to show current user related activity.
  * Required only for post comments - myself data



   */

  // Comment upvoting

});