const request = require('supertest');
const server = require('../../../app');

const UserHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const CommentsRepository = require('../../../lib/comments/comments-repository');
const CommentsHelper = require('../helpers/comments-helper');
const CommentsService = require('../../../lib/comments/comments-service');

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

  describe('Positive scenarios', async () => {
    it('Get posts with comments', async () => {

      const post_id = 1;

      const res = await request(server)
        .get(RequestHelper.getOnePostUrl(post_id))
      ;

      ResponseHelper.expectStatusOk(res);
      const body = res.body;

      expect(body.comments).toBeDefined();
      expect(body['User']).toBeDefined();

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

      const body = res.body;

      expect(Array.isArray(body.path)).toBeTruthy();

      CommentsHelper.checkCommentResponseBody(body);
      UserHelper.checkShortUserInfoResponse(body['User']);

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
      UserHelper.checkShortUserInfoResponse(body['User']);

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
      UserHelper.checkShortUserInfoResponse(body['User']);
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
