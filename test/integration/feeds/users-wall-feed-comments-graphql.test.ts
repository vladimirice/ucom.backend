import { CommentModel, CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

import CommonHelper = require('../helpers/common-helper');

const mockHelper = require('../helpers/mock-helper.ts');
const postsGenerator = require('../../generators/posts-generator.ts');
const commentsGenerator = require('../../generators/comments-generator.ts');

const seedsHelper = require('../helpers/seeds-helper.ts');
const commonHelper = require('../helpers/common-helper.ts');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 20000;

describe('#feeds #graphql', () => {
  beforeAll(async () => {
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      seedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine(true);
  });

  describe('Positive', () => {
    it('#smoke - check depth = 1 comments API', async () => {
      const commentsOfDepthZeroResponses: number = 4;
      const commentsOfDepthOneResponses: number = 5;

      const postId: number = await postsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await commentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await commentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await commentsGenerator.createManyCommentsForManyComments(
        postId,
        commentsOfDepthOne,
        userVlad,
        commentsOfDepthOneResponses,
      );

      const commentZeroDepth: CommentModel = comments[0];

      const page: number = 1;
      const perPage: number = commentsOfDepthZeroResponses - 1; // check pagination

      const response = await GraphqlHelper.getCommentsOnCommentAsMyself(
        userVlad,
        postId,
        commentZeroDepth.id,
        commentZeroDepth.depth,
        page,
        perPage,
      );

      expect(response).toBeDefined();
      const { data }: { data: CommentModelResponse[] } = response;

      expect(data).toBeDefined();
      expect(data.length).toBe(perPage);

      for (const item of data) {
        expect(item.commentable_id).toBe(postId);
        expect(item.parent_id).toBe(commentZeroDepth.id);
        expect(item.metadata.next_depth_total_amount).toBe(commentsOfDepthOneResponses);
      }

      const options: CheckerOptions = {
        myselfData    : true,
        postProcessing: 'list',
        comments: {
          isEmpty: false,
        },
      };

      await CommonHelper.checkManyCommentsV2(response, options);
    }, JEST_TIMEOUT);

    it('#smoke - comments api with next_depth amount', async () => {
      const commentsOfDepthZeroResponses: number = 4;
      const commentsOfDepthOneResponses: number = 5;

      const postId: number = await postsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await commentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await commentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await commentsGenerator.createManyCommentsForManyComments(
        postId,
        commentsOfDepthOne,
        userVlad,
        commentsOfDepthOneResponses,
      );

      // Check one more depth level
      // check depth for one commentZeroDepth

      const commentOneDepth: CommentModel = commentsOfDepthOne[0];

      const secondRequestPage: number = 1;
      const secondRequestPerPage: number = commentsOfDepthZeroResponses - 1; // check pagination

      const response = await GraphqlHelper.getCommentsOnCommentAsMyself(
        userVlad,
        postId,
        commentOneDepth.id,
        commentOneDepth.depth,
        secondRequestPage,
        secondRequestPerPage,
      );

      expect(response).toBeDefined();
      const { data }: { data: CommentModelResponse[] } =
          response;

      expect(data).toBeDefined();
      expect(data.length).toBe(secondRequestPerPage);

      for (const item of data) {
        expect(item.commentable_id).toBe(postId);
        expect(item.parent_id).toBe(commentOneDepth.id);
        expect(item.metadata.next_depth_total_amount).toBe(0);
      }

      const options: CheckerOptions = {
        myselfData    : true,
        postProcessing: 'list',
        comments: {
          isEmpty: false,
        },
      };

      await commonHelper.checkManyCommentsV2(response, options);
    }, JEST_TIMEOUT);

    it('#smoke - should get all depth = 0 comments', async () => {
      const targetUser = userVlad;
      const directPostAuthor = userJane;

      const promisesToCreatePosts = [
        postsGenerator.createMediaPostByUserHimself(targetUser),
        postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
      ];

      const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

      const [commentOne] = await Promise.all([
        commentsGenerator.createCommentForPost(postOneId, userJane),
        commentsGenerator.createCommentForPost(postOneId, userJane),
        commentsGenerator.createCommentForPost(postOneId, userJane),

        // disturbance
        commentsGenerator.createCommentForPost(postTwo.id, userJane),
      ]);

      await Promise.all([
        commentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
        commentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
      ]);

      const page: number = 1;
      const perPage: number = 10;

      const response = await GraphqlHelper.getPostCommentsAsMyself(
        userVlad,
        postOneId,
        page,
        perPage,
      );

      const { data } = response;

      expect(data.length).toBe(3);

      const options: CheckerOptions = {
        myselfData    : true,
        postProcessing: 'list',
        comments: {
          isEmpty: false,
        },
      };

      CommonHelper.checkManyCommentsV2(response, options);

      const commentWithComments = data.find(item => item.id === commentOne.id);

      expect(commentWithComments!.metadata.next_depth_total_amount).toBe(2);
    }, JEST_TIMEOUT);
  });
});

export {};
