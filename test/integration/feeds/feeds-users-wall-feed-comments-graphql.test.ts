import {
  CommentModel,
  CommentModelResponse,
} from '../../../lib/comments/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import CommonHelper = require('../helpers/common-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');
import ActivityHelper = require('../helpers/activity-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 20000;

describe('#feeds #graphql', () => {
  beforeAll(async () => {
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  it('#smoke Comment on comment should contain organization data', async () => {
    const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
    const parentComment: CommentModelResponse =
      await CommentsGenerator.createCommentForPost(postId, userJane);

    const commentOnComment: CommentModelResponse =
      await CommentsGenerator.createCommentOnComment(postId, parentComment.id, userVlad);

    await ActivityHelper.requestToFollowOrganization(orgId, userJane);

    const page = 1;
    const perPage = 10;

    const response = await GraphqlHelper.getCommentsOnCommentAsMyself(
      userVlad,
      postId,
      parentComment.id,
      parentComment.depth,
      page,
      perPage,
    );

    expect(response).toBeDefined();
    const commentsList: CommentModelResponse[] = response.data;

    expect(commentsList.length).toBe(1);
    const comment: CommentModelResponse = commentsList[0];
    expect(comment.id).toBe(commentOnComment.id);
    expect(comment.organization_id).toBe(orgId);

    OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
  });

  describe('Positive', () => {
    it('#smoke - check depth = 1 comments API', async () => {
      const commentsOfDepthZeroResponses: number = 4;
      const commentsOfDepthOneResponses: number = 5;

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await CommentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await CommentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await CommentsGenerator.createManyCommentsForManyComments(
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

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await CommentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await CommentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await CommentsGenerator.createManyCommentsForManyComments(
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

      await CommonHelper.checkManyCommentsV2(response, options);
    }, JEST_TIMEOUT);

    it('#smoke - should get all depth = 0 comments', async () => {
      const targetUser = userVlad;
      const directPostAuthor = userJane;

      const promisesToCreatePosts = [
        PostsGenerator.createMediaPostByUserHimself(targetUser),
        PostsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
      ];

      // @ts-ignore
      const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

      const [commentOne] = await Promise.all([
        CommentsGenerator.createCommentForPost(postOneId, userJane),
        CommentsGenerator.createCommentForPost(postOneId, userJane),
        CommentsGenerator.createCommentForPost(postOneId, userJane),

        // disturbance
        CommentsGenerator.createCommentForPost(postTwo.id, userJane),
      ]);

      await Promise.all([
        CommentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
        CommentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
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
