import MockHelper = require('../helpers/mock-helper');
import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');
import CommentsHelper = require('../helpers/comments-helper');
import CommonHelper = require('../helpers/common-helper');

export {};

const _ = require('lodash');

let userVlad;

MockHelper.mockPostTransactionSigning();
MockHelper.mockCommentTransactionSigning();
MockHelper.mockSendingToQueue();

describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad] = await Promise.all([
      UsersHelper.getUserVlad(),
    ]);
  });
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });
  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Comments only API - without parent post', () => {
    describe('Positive scenarios', () => {
      it.skip('should provide comments without auth', async () => {
      });

      it('should provide comment list by provided post ID', async () => {
        const postId = 1;

        const comments = await CommentsHelper.requestToGetManyCommentsAsMyself(userVlad, postId);
        expect(_.isEmpty(comments)).toBeFalsy();

        const options = {
          myselfData: true,
          commentItselfMetadata: true,
        };

        CommonHelper.checkManyCommentsPreviewWithRelations(comments, options);
      });
    });

    it.skip('should provide myself activity data', async () => {
    });
  });

  describe('Posts with comments', () => {
    describe('Positive scenarios', () => {
      it('[Smoke] One Post. Get with all comments', async () => {
        const postId = 1;

        const post = await PostsHelper.requestToGetOnePostAsGuest(postId);

        expect(post.comments).toBeDefined();

        UsersHelper.checkIncludedUserPreview(post);

        post.comments.forEach((comment) => {
          expect(comment.commentable_id).toBe(postId);
          expect(Array.isArray(comment.path)).toBeTruthy();
        });
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should check and catch activity_group_id content is created by org if it is created by user himself', async () => {
      });
    });
  });
});
