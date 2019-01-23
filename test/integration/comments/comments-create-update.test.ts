import MockHelper = require('../helpers/mock-helper');
import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');
import CommentsHelper = require('../helpers/comments-helper');
import RequestHelper = require('../helpers/request-helper');
import ResponseHelper = require('../helpers/response-helper');
import CommonHelper = require('../helpers/common-helper');

export {};

const request = require('supertest');
const server = require('../../../app');

const commentsRepository  = require('../../../lib/comments/comments-repository');
const postService         = require('../../../lib/posts/post-service');

let userVlad;

MockHelper.mockAllBlockchainPart();

const JEST_TIMEOUT = 10000;

describe('#comments create update', () => {
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

  describe('Positive', () => {
    describe('Media post related tests', () => {
      it('should create post with comment_count equal to zero', async () => {
        const newPostId = await PostsHelper.requestToCreateMediaPost(userVlad);

        const postStats = await postService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      // tslint:disable-next-line:max-line-length
      it('should increase comment amount when new comment is created for media post', async () => {
        const newPostId = await PostsHelper.requestToCreateMediaPost(userVlad);
        await CommentsHelper.requestToCreateComment(newPostId, userVlad);

        const postStats = await postService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      // tslint:disable-next-line
      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostsHelper.requestToCreateMediaPost(userVlad);
        const newRootComment = await CommentsHelper.requestToCreateComment(newPostId, userVlad);
        await CommentsHelper.requestToCreateCommentOnComment(
          newPostId,
          newRootComment.id,
          userVlad,
        );

        const postStats = await postService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      }, JEST_TIMEOUT);
    });
    describe('Post-offer related actions', () => {
      it('should create new with comment_count equal to zero', async () => {
        const newPostId = await PostsHelper.requestToCreatePostOffer(userVlad);
        const postStats = await postService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      it('should increase comment amount when new comment is created', async () => {
        const newPostId = await PostsHelper.requestToCreatePostOffer(userVlad);
        await CommentsHelper.requestToCreateComment(newPostId, userVlad);

        const postStats = await postService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      // tslint:disable-next-line:max-line-length
      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostsHelper.requestToCreatePostOffer(userVlad);
        const newRootComment = await CommentsHelper.requestToCreateComment(newPostId, userVlad);
        await CommentsHelper.requestToCreateCommentOnComment(
          newPostId,
          newRootComment.id,
          userVlad,
        );

        const postStats = await postService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      }, JEST_TIMEOUT);
    });
  });

  describe('Comment creation', () => {
    it('Create new comment for the post directly', async () => {
      const postId = 1;

      const fieldsToSet = {
        description: 'comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet.description);
      ResponseHelper.expectStatusCreated(res);

      const { body } = res;

      const options = {
        myselfData: true,
      };

      CommonHelper.checkOneCommentPreviewWithRelations(body, options);

      // #task It should be observed and deleted because of checkOneCommentPreviewWithRelations
      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);
      expect(lastComment).not.toBeNull();

      expect(body.path).toEqual([
        lastComment.id,
      ]);

      expect(lastComment.blockchain_id).not.toBeNull();
      expect(lastComment.parent_id).toBeNull();

      const expectedFields: any = fieldsToSet;
      expectedFields.current_vote = 0;
      expectedFields.commentable_id = postId;
      expectedFields.user_id = userVlad.id;
      expectedFields.path = [
        lastComment.id,
      ];
      expectedFields.blockchain_status = 0;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Create comment on comment - one level depth', async () => {
      const postId = 1;
      const parentCommentId = 1;

      const fieldsToSet = {
        description: 'comment on comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, parentCommentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet.description);
      ResponseHelper.expectStatusCreated(res);

      const { body } = res;
      expect(Array.isArray(body.path)).toBeTruthy();

      const options = {
        myselfData: true,
      };

      CommonHelper.checkOneCommentPreviewWithRelations(body, options);

      CommentsHelper.checkCommentResponseBody(body);
      UsersHelper.checkIncludedUserPreview(body);

      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);

      expect(body.path).toEqual([parentCommentId, lastComment.id]);

      expect(lastComment).not.toBeNull();
      expect(lastComment.blockchain_id).not.toBeNull();

      const expectedFields: any = fieldsToSet;
      expectedFields.current_vote = 0;
      expectedFields.commentable_id = postId;
      expectedFields.user_id = userVlad.id;
      expectedFields.parent_id = parentCommentId;

      expectedFields.path = [
        parentCommentId,
        lastComment.id,
      ];
      expectedFields.depth = 1;

      expectedFields.blockchain_status = 0;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Path when added comment has middle depth', async () => {
      const postId = 1;
      const parentCommentId = 5;

      const fieldsToSet = {
        description: 'comment on comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, parentCommentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet.description);
      ResponseHelper.expectStatusCreated(res);

      const { body } = res;

      CommentsHelper.checkCommentResponseBody(body);
      UsersHelper.checkIncludedUserPreview(body);
      expect(Array.isArray(body.path)).toBeTruthy();

      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);

      const parentComment = await commentsRepository.findOneById(parentCommentId);

      const expectedPathJson = JSON.parse(parentComment.path);
      expectedPathJson.push(lastComment.id);

      expect(lastComment).not.toBeNull();
      expect(lastComment.blockchain_id).not.toBeNull();

      const expectedFields: any = fieldsToSet;
      expectedFields.current_vote = 0;
      expectedFields.commentable_id = postId;
      expectedFields.user_id = userVlad.id;
      expectedFields.parent_id = parentCommentId;

      expectedFields.path = expectedPathJson;
      expectedFields.depth = 4;

      expectedFields.blockchain_status = 0;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });
  });

  describe('Negative scenarios', () => {
    it('Not possible to post comment without auth token', async () => {
      const postId = 1;

      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(postId))
        .field('description', 'comment description');
      ResponseHelper.expectStatusUnauthorized(res);
    });

    it('Not possible to create comment with malformed post ID', async () => {
      const postId = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to create comment for post which does not exist', async () => {
      const postId = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post which does not exist', async () => {
      const postId = 100500;
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post with malformed ID', async () => {
      const postId = 'malformed';
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusBadRequest(res);
    });

    // tslint:disable-next-line:max-line-length
    it('Not possible to create comment on comment for the comment which does not exist', async () => {
      const postId = 1;
      const commentId = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the comment with malformed ID', async () => {
      const postId = 1;
      const commentId = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to to create comment on comment without auth token', async () => {
      const postId = 1;
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .field('description', 'comment description');
      ResponseHelper.expectStatusUnauthorized(res);
    });
  });
});
