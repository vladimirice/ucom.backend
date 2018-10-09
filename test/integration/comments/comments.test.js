const request = require('supertest');
const _ = require('lodash');
const server = require('../../../app');
const reqlib = require('app-root-path').require;

const helpers = require('../helpers');

const CommentsRepository = reqlib('/lib/comments/comments-repository');
const PostService = reqlib('/lib/posts/post-service');

let userVlad, userJane;

helpers.Mock.mockPostTransactionSigning();
helpers.Mock.mockCommentTransactionSigning();
helpers.Mock.mockSendingToQueue();

describe('Comments', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      helpers.Users.getUserVlad(),
      helpers.Users.getUserJane()
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
      it('should show comment_count for list of posts', async function () {
        const posts = await helpers.Posts.requestToGetManyPostsAsGuest();

        posts.forEach(post => {
          expect(post).toHaveProperty('post_stats');
          expect(post['post_stats']).toHaveProperty('comments_count', 0);
        });
      });

      it('should show correct comment_count for post which has comments', async () => {
        const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);

        await helpers.Comments.requestToCreateComment(newPostId, userVlad);
        // const posts = await PostHelper.requestToGetPostsAsGuest();
        //
        // const newPostData = posts.find(data => data.id === newPostId);
        //
        // expect(newPostData['post_stats']['comments_count']).toBe(1);
      }, 30000);
    });
    describe('should update post comment stats', async () => {

      describe('Media post related tests', function () {
        it('should create post with comment_count equal to zero', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);

          const postStats = await PostService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(0);
        });

        it('should increase comment amount when new comment is created for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);
          await helpers.Comments.requestToCreateComment(newPostId, userVlad);

          const postStats = await PostService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(1);
        });

        it('should increase comment count for comment on comment action for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreateMediaPost(userVlad);
          const newRootComment = await helpers.Comments.requestToCreateComment(newPostId, userVlad);
          await helpers.Comments.requestToCreateCommentOnComment(newPostId, newRootComment.id, userVlad);

          const postStats = await PostService.findPostStatsById(newPostId);

          expect(postStats.comments_count).toBe(2);
        });
      });

      describe('Post-offer related actions', function () {
        it('should create new with comment_count equal to zero', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          const postStats = await PostService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(0);
        });

        it('should increase comment amount when new comment is created', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          await helpers.Comments.requestToCreateComment(newPostId, userVlad);

          const postStats = await PostService.findPostStatsById(newPostId);
          expect(postStats.comments_count).toBe(1);
        });

        it('should increase comment count for comment on comment action for media post', async () => {
          const newPostId = await helpers.Posts.requestToCreatePostOffer(userVlad);
          const newRootComment = await helpers.Comments.requestToCreateComment(newPostId, userVlad);
          await helpers.Comments.requestToCreateCommentOnComment(newPostId, newRootComment.id, userVlad);

          const postStats = await PostService.findPostStatsById(newPostId);

          expect(postStats.comments_count).toBe(2);
        });
      });
    });
  });

  describe('Comments only API - without parent post', () => {
    describe('Positive scenarios', () => {
      it('should provide comment list by provided post ID', async () => {
        const postId = 1;

        const comments = await helpers.Comments.requestToGetManyCommentsAsMyself(userVlad, postId);
        expect(_.isEmpty(comments)).toBeFalsy();

        const extraFields = [
          'User',
          'activity_user_comment',
          'organization',
          'myselfData'
        ];

        comments.forEach(comment => {
          helpers.Comments.checkOneCommentPreviewFields(comment, extraFields);

          helpers.Users.checkUserPreview(comment.User);

          if (comment.organization) {
            helpers.Org.checkOneOrganizationPreviewFields(comment.organization);
          }
        });

      });
    });

    it('should provide myself activity data', async () => {
      // TODO
    });
  });

  describe('Posts with comments', function () {
    describe('Positive scenarios', async () => {
      it('One Post. Get with all comments', async () => {
        const postId = 1;

        const post = await helpers.Posts.requestToGetOnePostAsGuest(postId);

        expect(post.comments).toBeDefined();

        helpers.Users.checkIncludedUserPreview(post);

        post.comments.forEach(comment => {
          expect(comment.commentable_id).toBe(postId);
          expect(Array.isArray(comment.path)).toBeTruthy();
        });

        // TODO provide more checks
      });

      it('should check and catch activity_group_id content is created by org if it is created by user himself', async () => {
        // TODO
      });

      describe('Comment creation', () => {
        it('Create new comment for the post directly', async () => {
          const post_id = 1;

          const fieldsToSet = {
            'description': 'comment description',
          };

          const res = await request(server)
            .post(helpers.Req.getCommentsUrl(post_id))
            .set('Authorization', `Bearer ${userVlad.token}`)
            .field('description', fieldsToSet['description'])
          ;

          helpers.Res.expectStatusCreated(res);

          // Expect comments amount will be increased

          const body = res.body;

          expect(Array.isArray(body.path)).toBeTruthy();

          helpers.Comments.checkCommentResponseBody(body);
          helpers.Users.checkIncludedUserPreview(body);

          const lastComment = await CommentsRepository.findLastCommentByAuthor(userVlad.id);
          expect(lastComment).not.toBeNull();

          expect(body.path).toEqual([
            lastComment.id
          ]);

          expect(lastComment['blockchain_id']).not.toBeNull();
          expect(lastComment['parent_id']).toBeNull();

          let expectedFields = fieldsToSet;
          expectedFields['current_vote'] = 0;
          expectedFields['commentable_id'] = post_id;
          expectedFields['user_id'] = userVlad.id;
          expectedFields['path'] = [
            lastComment.id
          ];
          expectedFields['blockchain_status'] = 0;

          helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
        }, 10000);

        it('Create comment on comment - one level depth', async () => {
          const post_id = 1;
          const parent_comment_id = 1;

          const fieldsToSet = {
            'description': 'comment on comment description',
          };

          const res = await request(server)
            .post(helpers.Req.getCommentOnCommentUrl(post_id, parent_comment_id))
            .set('Authorization', `Bearer ${userVlad.token}`)
            .field('description', fieldsToSet['description'])
          ;

          helpers.Res.expectStatusCreated(res);

          const body = res.body;
          expect(Array.isArray(body.path)).toBeTruthy();

          helpers.Comments.checkCommentResponseBody(body);
          helpers.Users.checkIncludedUserPreview(body);

          const lastComment = await CommentsRepository.findLastCommentByAuthor(userVlad.id);

          expect(body.path).toEqual([parent_comment_id, lastComment.id]);

          expect(lastComment).not.toBeNull();
          expect(lastComment['blockchain_id']).not.toBeNull();

          let expectedFields = fieldsToSet;
          expectedFields['current_vote'] = 0;
          expectedFields['commentable_id'] = post_id;
          expectedFields['user_id'] = userVlad.id;
          expectedFields['parent_id'] = parent_comment_id;

          expectedFields['path'] = [
            parent_comment_id,
            lastComment.id
          ];
          expectedFields['depth'] = 1;

          expectedFields['blockchain_status'] = 0;

          helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
        });

        it('Path when added comment has middle depth', async () => {
          const post_id = 1;
          const parent_comment_id = 5;

          const fieldsToSet = {
            'description': 'comment on comment description',
          };

          const res = await request(server)
            .post(helpers.Req.getCommentOnCommentUrl(post_id, parent_comment_id))
            .set('Authorization', `Bearer ${userVlad.token}`)
            .field('description', fieldsToSet['description'])
          ;

          helpers.Res.expectStatusCreated(res);

          const body = res.body;

          helpers.Comments.checkCommentResponseBody(body);
          helpers.Users.checkIncludedUserPreview(body);
          expect(Array.isArray(body.path)).toBeTruthy();

          const lastComment = await CommentsRepository.findLastCommentByAuthor(userVlad.id);

          const parentComment = await CommentsRepository.findOneById(parent_comment_id);

          let expectedPathJson = parentComment.getPathAsJson();
          expectedPathJson.push(lastComment.id);

          expect(lastComment).not.toBeNull();
          expect(lastComment['blockchain_id']).not.toBeNull();

          let expectedFields = fieldsToSet;
          expectedFields['current_vote'] = 0;
          expectedFields['commentable_id'] = post_id;
          expectedFields['user_id'] = userVlad.id;
          expectedFields['parent_id'] = parent_comment_id;

          expectedFields['path'] = expectedPathJson;
          expectedFields['depth'] = 4;

          expectedFields['blockchain_status'] = 0;

          helpers.Res.expectValuesAreExpected(expectedFields, lastComment);
        }, 10000)

      });
    })
  });

  describe('Negative scenarios', () => {
    it('Not possible to post comment without auth token', async () => {
      const post_id = 1;

      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(post_id))
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusUnauthorized(res);
    });

    it('Not possible to create comment with malformed post ID', async () => {
      const post_id = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    it('Not possible to create comment for post which does not exist', async () => {
      const post_id = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentsUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post which does not exist', async () => {
      const post_id = 100500;
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post with malformed ID', async () => {
      const post_id = 'malformed';
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    it('Not possible to create comment on comment for the comment which does not exist', async () => {
      const post_id = 1;
      const comment_id = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the comment with malformed ID', async () => {
      const post_id = 1;
      const comment_id = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description', 'comment description')
      ;

      helpers.Res.expectStatusBadRequest(res);
    });

    it('Not possible to to create comment on comment without auth token', async () => {
      const post_id = 1;
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(helpers.Req.getCommentOnCommentUrl(post_id, comment_id))
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
