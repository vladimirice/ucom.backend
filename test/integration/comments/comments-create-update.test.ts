import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import CommentsHelper = require('../helpers/comments-helper');
import RequestHelper = require('../helpers/request-helper');
import ResponseHelper = require('../helpers/response-helper');
import CommonHelper = require('../helpers/common-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import PostService = require('../../../lib/posts/post-service');
import CommentsRepository = require('../../../lib/comments/comments-repository');

const request = require('supertest');
const server = require('../../../app');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

describe('#comments create update', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });


  describe('Positive', () => {
    describe('Media post related tests', () => {
      it('should create post with comment_count equal to zero', async () => {
        const newPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      it('should increase comment amount when new comment is created for media post', async () => {
        const newPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        await CommentsGenerator.createCommentForPost(newPostId, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const newRootComment = await CommentsGenerator.createCommentForPost(newPostId, userVlad);
        await CommentsGenerator.createCommentOnComment(
          newPostId,
          newRootComment.id,
          userVlad,
        );

        const postStats = await PostService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      }, JEST_TIMEOUT);
    });
    describe('Post-offer related actions', () => {
      it('should create new with comment_count equal to zero', async () => {
        const newPostId = await PostsGenerator.createPostOfferByUserHimself(userVlad);
        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      it('should increase comment amount when new comment is created', async () => {
        const newPostId = await PostsGenerator.createPostOfferByUserHimself(userVlad);
        await CommentsGenerator.createCommentForPost(newPostId, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostsGenerator.createPostOfferByUserHimself(userVlad);
        const newRootComment = await CommentsGenerator.createCommentForPost(newPostId, userVlad);
        await CommentsGenerator.createCommentOnComment(
          newPostId,
          newRootComment.id,
          userVlad,
        );

        const postStats = await PostService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      }, JEST_TIMEOUT);
    });
  });

  describe('Comment creation', () => {
    it('Create new comment for the post directly', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

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
      const lastComment = await CommentsRepository.findLastCommentByAuthor(userVlad.id);
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
      const postId: number =
        await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const parentCommentId: number =
        await CommentsGenerator.createCommentForPostAndGetId(postId, userJane);

      const description = 'comment on comment description';

      const body = await CommentsGenerator.createCommentOnComment(postId, parentCommentId, userVlad, description);

      expect(Array.isArray(body.path)).toBeTruthy();

      const options = {
        myselfData: true,
      };

      CommonHelper.checkOneCommentPreviewWithRelations(body, options);

      CommentsHelper.checkCommentResponseBody(body);
      UsersHelper.checkIncludedUserPreview(body);

      const lastComment = await CommentsRepository.findLastCommentByAuthor(userVlad.id);

      expect(body.path).toEqual([parentCommentId, lastComment.id]);

      expect(lastComment).not.toBeNull();
      expect(lastComment.blockchain_id).not.toBeNull();

      const expectedFields: any = {};
      expectedFields.current_vote = 0;
      expectedFields.commentable_id = postId;
      expectedFields.user_id = userVlad.id;
      expectedFields.parent_id = parentCommentId;
      expectedFields.description = description;

      expectedFields.path = [
        parentCommentId,
        lastComment.id,
      ];
      expectedFields.depth = 1;

      expectedFields.blockchain_status = 0;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Path when added comment has middle depth', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const firstCommentId: number =
        await CommentsGenerator.createCommentForPostAndGetId(postId, userJane);
      const secondCommentId: number =
        await CommentsGenerator.createCommentOnCommentAndGetId(postId, firstCommentId, userVlad);
      const thirdCommentId: number =
        await CommentsGenerator.createCommentOnCommentAndGetId(postId, secondCommentId, userJane);

      const forthCommentId: number =
        await CommentsGenerator.createCommentOnCommentAndGetId(postId, thirdCommentId, userVlad);

      const description = 'comment on comment description';

      const body = await CommentsGenerator.createCommentOnComment(postId, forthCommentId, userJane, description);

      CommentsHelper.checkCommentResponseBody(body);
      UsersHelper.checkIncludedUserPreview(body);
      expect(Array.isArray(body.path)).toBeTruthy();

      const lastComment = await CommentsRepository.findLastCommentByAuthor(userJane.id);

      const parentComment = await CommentsRepository.findOneById(forthCommentId);

      const expectedPathJson = JSON.parse(parentComment.path);
      expectedPathJson.push(lastComment.id);

      expect(lastComment).not.toBeNull();
      expect(lastComment.blockchain_id).not.toBeNull();

      const expectedFields: any = {};
      expectedFields.description = description;
      expectedFields.current_vote = 0;
      expectedFields.commentable_id = postId;
      expectedFields.user_id = userJane.id;
      expectedFields.parent_id = forthCommentId;

      expectedFields.path = expectedPathJson;
      expectedFields.depth = 4;

      expectedFields.blockchain_status = 0;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });
  });

  describe('Negative scenarios', () => {
    it('Not possible to post comment without auth token', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

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
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const commentId = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the comment with malformed ID', async () => {
      const postId = PostsGenerator.createMediaPostByUserHimself(userVlad);
      const commentId = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description');
      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to to create comment on comment without auth token', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const commentId: number = await CommentsGenerator.createCommentForPostAndGetId(postId, userJane);

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(postId, commentId))
        .field('description', 'comment description');
      ResponseHelper.expectStatusUnauthorized(res);
    });
  });
});

export {};
