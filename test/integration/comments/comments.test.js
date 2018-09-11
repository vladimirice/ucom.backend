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
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('should show comment_count stats for list of posts', async () => {
    it('should show comment_count for list of posts', async function () {
      const posts = await PostHelper.requestToGetPostsAsGuest();

      posts.forEach(post => {
        expect(post).toHaveProperty('post_stats');
        expect(post['post_stats']).toHaveProperty('comments_count', 0);
      });
    });

    it('should show correct comment_count for post which has comments', async () => {
      const newPostId = await PostHelper.requestToCreateMediaPost(userVlad);
      await CommentsHelper.requestToCreateComment(newPostId, userVlad);

      const posts = await PostHelper.requestToGetPostsAsGuest();

      const newPostData = posts.find(data => data.id === newPostId);

      expect(newPostData['post_stats']['comments_count']).toBe(1);
    });
  });

  describe('should update post comment stats', async () => {

    describe('Media post related tests', function () {
      it('should create post with comment_count equal to zero', async () => {
        const newPostId = await PostHelper.requestToCreateMediaPost(userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      it('should increase comment amount when new comment is created for media post', async () => {
        const newPostId = await PostHelper.requestToCreateMediaPost(userVlad);
        await CommentsHelper.requestToCreateComment(newPostId, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostHelper.requestToCreateMediaPost(userVlad);
        const newRootComment = await CommentsHelper.requestToCreateComment(newPostId, userVlad);
        await CommentsHelper.requestToCreateCommentOnComment(newPostId, newRootComment.id, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      });
    });

    describe('Post-offer related actions', function () {
      it('should create new with comment_count equal to zero', async () => {
        const newPostId = await PostHelper.requestToCreatePostOffer(userVlad);
        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(0);
      });

      it('should increase comment amount when new comment is created', async () => {
        const newPostId = await PostHelper.requestToCreatePostOffer(userVlad);
        await CommentsHelper.requestToCreateComment(newPostId, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);
        expect(postStats.comments_count).toBe(1);
      });

      it('should increase comment count for comment on comment action for media post', async () => {
        const newPostId = await PostHelper.requestToCreatePostOffer(userVlad);
        const newRootComment = await CommentsHelper.requestToCreateComment(newPostId, userVlad);
        await CommentsHelper.requestToCreateCommentOnComment(newPostId, newRootComment.id, userVlad);

        const postStats = await PostService.findPostStatsById(newPostId);

        expect(postStats.comments_count).toBe(2);
      });
    });
  });

  describe('Positive scenarios', async () => {
    it('Get posts with comments', async () => {

      const post_id = 1;

      const res = await request(server)
        .get(RequestHelper.getOnePostUrl(post_id))
      ;

      ResponseHelper.expectStatusOk(res);
      const body = res.body;

      expect(body.comments).toBeDefined();

      let expected = UserRepository.getModel().getFieldsForPreview();

      expected.push('followed_by');

      UserHelper.checkIncludedUserPreview(body, expected);

      body.comments.forEach(comment => {
        expect(Array.isArray(comment.path)).toBeTruthy();
      });

      // let sortedComments = body.comments.map(comment => {
      //   return {
      //     id: comment.id,
      //     path: comment.path
      //   }
      // });

      // sortedComments.sort((a, b) => {
      //   if (a.path < b.path)
      //     return -1;
      //   if (a.path > b.path)
      //     return 1;
      //   return 0;
      // });

      // for (let i = 0; i < sortedComments.length; i++) {
      //   expect(body.comments[i]['id']).toBe(sortedComments[i]['id']);
      // }
    });

    it('Create new comment for the post directly', async () => {
      const post_id = 1;

      const fieldsToSet = {
        'description': 'comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send(fieldsToSet)
      ;

      ResponseHelper.expectStatusCreated(res);

      // Expect comments amount will be increased

      const body = res.body;

      expect(Array.isArray(body.path)).toBeTruthy();

      CommentsHelper.checkCommentResponseBody(body);
      UserHelper.checkIncludedUserPreview(body);

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
      expectedFields['blockchain_status'] = 10;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Create comment on comment - one level depth', async () => {
      const post_id = 1;
      const parent_comment_id = 1;

      const fieldsToSet = {
        'description': 'comment on comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, parent_comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send(fieldsToSet)
      ;

      ResponseHelper.expectStatusCreated(res);

      const body = res.body;
      expect(Array.isArray(body.path)).toBeTruthy();

      CommentsHelper.checkCommentResponseBody(body);
      UserHelper.checkIncludedUserPreview(body);

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

      expectedFields['blockchain_status'] = 10;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });

    it('Path when added comment has middle depth', async () => {
      const post_id = 1;
      const parent_comment_id = 5;

      const fieldsToSet = {
        'description': 'comment on comment description',
      };

      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, parent_comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send(fieldsToSet)
      ;

      ResponseHelper.expectStatusCreated(res);

      const body = res.body;

      CommentsHelper.checkCommentResponseBody(body);
      UserHelper.checkIncludedUserPreview(body);
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

      expectedFields['blockchain_status'] = 10;

      ResponseHelper.expectValuesAreExpected(expectedFields, lastComment);
    });
  });

  describe('Negative scenarios', () => {

    // it('Not possible to exceed max comments depth', async () => {
    //   const post_id = 1;
    //
    //   const maxDepthComment = await CommentsRepository.getWithMaxDepthByCommentableId(post_id);
    //   const maxDepth = CommentsService.getMaxDepth();
    //
    //   let lastCommentId = maxDepthComment.id;
    //   let lastDepth = maxDepthComment.depth;
    //   let res;
    //
    //   do {
    //     res = await request(server)
    //       .post(RequestHelper.getCommentOnCommentUrl(post_id, lastCommentId))
    //       .set('Authorization', `Bearer ${userVlad.token}`)
    //       .send({
    //         'description': 'comment on comment description',
    //       })
    //     ;
    //
    //     ResponseHelper.expectStatusCreated(res);
    //
    //     lastCommentId = +res.body.id;
    //     lastDepth = res.body.depth;
    //   } while (lastDepth < maxDepth);
    //
    //   res = await request(server)
    //     .post(RequestHelper.getCommentOnCommentUrl(post_id, lastCommentId))
    //     .set('Authorization', `Bearer ${userVlad.token}`)
    //     .send({
    //       'description': 'comment on comment description',
    //     })
    //   ;
    //
    //   ResponseHelper.expectStatusBadRequest(res);
    // });

    it('Not possible to post comment without auth token', async () => {
      const post_id = 1;

      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(post_id))
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });

    it('Not possible to create comment with malformed post ID', async () => {
      const post_id = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to create comment for post which does not exist', async () => {
      const post_id = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentsUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post which does not exist', async () => {
      const post_id = 100500;
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the post with malformed ID', async () => {
      const post_id = 'malformed';
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to create comment on comment for the comment which does not exist', async () => {
      const post_id = 1;
      const comment_id = 100500;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to create comment on comment for the comment with malformed ID', async () => {
      const post_id = 1;
      const comment_id = 'malformed';

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to to create comment on comment without auth token', async () => {
      const post_id = 1;
      const comment_id = 1;

      // noinspection JSCheckFunctionSignatures
      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .send({
          'description': 'comment description',
        })
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });

    it('Try to send not allowed field', async () => {
      const post_id = 1;
      const comment_id = 1;

      const fieldsToSet = {
        'description': 'comment description',
        'parent_id': 1,
        'commentable_id': 10,
        'user_id': 10,
        'id': 1
      };

      const res = await request(server)
        .post(RequestHelper.getCommentOnCommentUrl(post_id, comment_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .send(fieldsToSet)
      ;

      ResponseHelper.expectStatusBadRequest(res);

      ResponseHelper.checkValidErrorResponse(res, [
        'commentable_id',
        'user_id',
        'id',
        'parent_id'
      ]);
    })
  });
});
