export {};

const request = require('supertest');
const _ = require('lodash');
const server = require('../../../app');
const helpers = require('../helpers');

const commentsRepository  = require('../../../lib/comments/comments-repository');
const postService         = require('../../../lib/posts/post-service');

let userVlad;

helpers.Mock.mockPostTransactionSigning();
helpers.Mock.mockCommentTransactionSigning();
helpers.Mock.mockSendingToQueue();

describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad] = await Promise.all([
      helpers.Users.getUserVlad(),
    ]);
  });
  beforeEach(async () => {
    await helpers.Seeds.initSeeds();
  });
  afterAll(async () => {
    await helpers.Seeds.sequelizeAfterAll();
  });

  describe('Comments stats', () => {
    describe('should show comment_count stats for list of posts', async () => {
      it('should show correct comment_count for post which has comments', async () => {
        const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);

        await helpers.Comments.requestToCreateComment(newPostId, userVlad);
        const posts = await helpers.Posts.requestToGetManyPostsAsGuest();
        const newPostData = posts.find(data => data.id === newPostId);

        expect(newPostData.comments_count).toBe(1);
      });
    });
    describe('should update post comment stats', async () => {

      describe('Media post related tests', () => {
        it('should create post with comment_count equal to zero', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);

          const postStats = await postService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(0);
        });

        // tslint:disable-next-line:max-line-length
        it('should increase comment amount when new comment is created for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);
          await helpers.Comments.requestToCreateComment(newPostId, userVlad);

          const postStats = await postService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(1);
        });

        // tslint:disable-next-line
        it('should increase comment count for comment on comment action for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);
          const newRootComment = await helpers.Comments.requestToCreateComment(newPostId, userVlad);
          await helpers.Comments.requestToCreateCommentOnComment(
            newPostId,
            newRootComment.id,
            userVlad,
          );

          const postStats = await postService.findPostStatsById(newPostId);

          expect(postStats.comments_count).toBe(2);
        });
      });

      describe('Post-offer related actions', () => {
        it('should create new with comment_count equal to zero', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          const postStats = await postService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(0);
        });

        it('should increase comment amount when new comment is created', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          await helpers.Comments.requestToCreateComment(newPostId, userVlad);

          const postStats = await postService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(1);
        });

        // tslint:disable-next-line:max-line-length
        it('should increase comment count for comment on comment action for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          const newRootComment = await helpers.Comments.requestToCreateComment(newPostId, userVlad);
          await helpers.Comments.requestToCreateCommentOnComment(
            newPostId,
            newRootComment.id,
            userVlad,
          );

          const postStats = await postService.findPostStatsById(newPostId);

          expect(postStats.comments_count).toBe(2);
        });
      });
    });
  });

  describe('Comments only API - without parent post', () => {
    describe('Positive scenarios', () => {

      it.skip('should provide comments without auth', async () => {
      });

      it('should provide comment list by provided post ID', async () => {
        const postId = 1;

        const comments = await helpers.Comments.requestToGetManyCommentsAsMyself(userVlad, postId);
        expect(_.isEmpty(comments)).toBeFalsy();

        const options = {
          myselfData: true,
        };

        helpers.Common.checkManyCommentsPreviewWithRelations(comments, options);
      });
    });

    it.skip('should provide myself activity data', async () => {
    });
  });

  describe('Comment creation', () => {
    it('Create new comment for the post directly', async () => {
      const postId = 1;

      const fieldsToSet = {
        description: 'comment description',
      };

      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet['description'])
      ;

      helpers.Res.expectStatusCreated(res);

      const body = res.body;

      const options = {
        myselfData: true,
      };

      helpers.Common.checkOneCommentPreviewWithRelations(body, options);

      // #task It should be observed and deleted because of checkOneCommentPreviewWithRelations
      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);
      expect(lastComment).not.toBeNull();

      expect(body.path).toEqual([
        lastComment.id,
      ]);

      expect(lastComment['blockchain_id']).not.toBeNull();
      expect(lastComment['parent_id']).toBeNull();

      const expectedFields = fieldsToSet;
      expectedFields['current_vote'] = 0;
      expectedFields['commentable_id'] = postId;
      expectedFields['user_id'] = userVlad.id;
      expectedFields['path'] = [
        lastComment.id,
      ];
      expectedFields['blockchain_status'] = 0;

      helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Create comment on comment - one level depth', async () => {
      const postId = 1;
      const parentCommentId = 1;

      const fieldsToSet = {
        description: 'comment on comment description',
      };

      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, parentCommentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet['description'])
      ;

      helpers.Res.expectStatusCreated(res);

      const body = res.body;
      expect(Array.isArray(body.path)).toBeTruthy();

      const options = {
        myselfData: true,
      };

      helpers.Common.checkOneCommentPreviewWithRelations(body, options);

      helpers.Comments.checkCommentResponseBody(body);
      helpers.Users.checkIncludedUserPreview(body);

      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);

      expect(body.path).toEqual([parentCommentId, lastComment.id]);

      expect(lastComment).not.toBeNull();
      expect(lastComment['blockchain_id']).not.toBeNull();

      const expectedFields = fieldsToSet;
      expectedFields['current_vote'] = 0;
      expectedFields['commentable_id'] = postId;
      expectedFields['user_id'] = userVlad.id;
      expectedFields['parent_id'] = parentCommentId;

      expectedFields['path'] = [
        parentCommentId,
        lastComment.id,
      ];
      expectedFields['depth'] = 1;

      expectedFields['blockchain_status'] = 0;

      helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Path when added comment has middle depth', async () => {
      const postId = 1;
      const parentCommentId = 5;

      const fieldsToSet = {
        description: 'comment on comment description',
      };

      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, parentCommentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', fieldsToSet['description'])
      ;

      helpers.Res.expectStatusCreated(res);

      const body = res.body;

      helpers.Comments.checkCommentResponseBody(body);
      helpers.Users.checkIncludedUserPreview(body);
      expect(Array.isArray(body.path)).toBeTruthy();

      const lastComment = await commentsRepository.findLastCommentByAuthor(userVlad.id);

      const parentComment = await commentsRepository.findOneById(parentCommentId);

      const expectedPathJson = JSON.parse(parentComment.path);
      expectedPathJson.push(lastComment.id);

      expect(lastComment).not.toBeNull();
      expect(lastComment['blockchain_id']).not.toBeNull();

      const expectedFields = fieldsToSet;
      expectedFields['current_vote'] = 0;
      expectedFields['commentable_id'] = postId;
      expectedFields['user_id'] = userVlad.id;
      expectedFields['parent_id'] = parentCommentId;

      expectedFields['path'] = expectedPathJson;
      expectedFields['depth'] = 4;

      expectedFields['blockchain_status'] = 0;

      helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
    });
  });

  describe('Posts with comments', () => {
    describe('Positive scenarios', async () => {
      it('[Smoke] One Post. Get with all comments', async () => {
        const postId = 1;

        const post = await helpers.Posts.requestToGetOnePostAsGuest(postId);

        expect(post.comments).toBeDefined();

        helpers.Users.checkIncludedUserPreview(post);

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

  describe('Negative scenarios', () => {
    it('Not possible to post comment without auth token', async () => {
      const postId = 1;

      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(postId))
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusUnauthorized(res);
    });

    it('Not possible to create comment with malformed post ID', async () => {
      const postId = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    it('Not possible to create comment for post which does not exist', async () => {
      const postId = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post which does not exist', async () => {
      const postId = 100500;
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post with malformed ID', async () => {
      const postId = 'malformed';
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    // tslint:disable-next-line:max-line-length
    it('Not possible to create comment on comment for the comment which does not exist', async () => {
      const postId = 1;
      const commentId = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the comment with malformed ID', async () => {
      const postId = 1;
      const commentId = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, commentId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    it('Not possible to to create comment on comment without auth token', async () => {
      const postId = 1;
      const commentId = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(postId, commentId))
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusUnauthorized(res);
    });

    // it('Try to send not allowed field', async () => {
    //   const post_id = 1;
    //   const comment_id = 1;
    //
    //   const fieldsToSet = {
    //     'description': 'comment description',
    //     'parent_id': 1,
    //     'commentable_id': 10,
    //     'user_id': 10,
    //     'id': 1
    //   };
    //
    //   const res = await request(server)
    //     .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
    //     .set('Authorization', `Bearer ${userVlad.token}`)
    //     .send(fieldsToSet)
    //   ;
    //
    //   helpers.Res.expectStatusBadRequest(res);
    //
    //   helpers.Res.checkValidErrorResponse(res, [
    //     'commentable_id',
    //     'user_id',
    //     'id',
    //     'parent_id'
    //   ]);
    // })
  });
});
