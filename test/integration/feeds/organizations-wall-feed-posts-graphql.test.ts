import { GraphqlHelper } from '../helpers/graphql-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import CommonHelper = require('../helpers/common-helper');
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

require('cross-fetch/polyfill');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 20000 * 10;

describe('#organizations #feed #graphql', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('#smoke - should get all organization-related posts', async () => {
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const promisesToCreatePosts = [
        PostsGenerator.createMediaPostOfOrganization(userVlad, orgId),
        PostsGenerator.createDirectPostForOrganization(userJane, orgId),
      ];

      const [orgMediaPostId, orgDirectPost] = await Promise.all(promisesToCreatePosts);
      // @ts-ignore
      const orgMediaComments: CommentModelResponse[] =
        await CommentsGenerator.createManyCommentsForPost(
          orgMediaPostId,
          userJane,
          3,
        );

      // @ts-ignore
      const directPostComments: CommentModelResponse[] =
        await CommentsGenerator.createManyCommentsForPost(orgDirectPost.id, userVlad, 3);

      const feedPage = 1;
      const feedPerPage = 3;

      const commentsPage = 1;
      const commentsPerPage = 10;

      // @ts-ignore
      const response = await GraphqlHelper.getOrgWallFeedAsMyself(
        userVlad, orgId, feedPage, feedPerPage, commentsPage, commentsPerPage,
      );
      const { data } = response;

      expect(data.length).toBe(2);
      const mediaPostModel = data.find(item => item.id === orgMediaPostId);
      expect(mediaPostModel).toBeDefined();

      const mediaPostOptions: CheckerOptions = {
        model: {
          myselfData: true,
        },
        postProcessing: 'list',
        comments: {
          myselfData: true,
          isEmpty: false,
        },
        organization: {
          required: true,
          expectedId: orgId,
        },
      };

      const directPostOptions: CheckerOptions = {
        model: {
          myselfData: true,
        },
        postProcessing: 'list',
        comments: {
          myselfData: true,
          isEmpty: false,
        },
        organization: {
          required: false,
        },
      };

      CommonHelper.checkOnePostV2(mediaPostModel, mediaPostOptions);

      const directPostModel = data.find(item => item.id === orgDirectPost.id);
      expect(directPostModel).toBeDefined();

      CommonHelper.checkOnePostV2(directPostModel, directPostOptions);

      // Only first level comments (depth = 0)
      // const commentOnCommentExistence = postOne.comments.data.some(
      //   item => item.id === commentOnComment.id,
      // );
      // expect(commentOnCommentExistence).toBeFalsy();
      // expect(postOne.comments.data.length).toBe(3);
      //
      // const expectedPostOneLastCommentId = 1;
      // expect(postOne.comments.data[0].id).toBe(expectedPostOneLastCommentId);
      //
      // const postOneCommentsMetadata = postOne.comments.metadata;
      // expect(postOneCommentsMetadata).toBeDefined();
      //
      // expect(postOneCommentsMetadata.page).toBe(commentsPage);
      // expect(postOneCommentsMetadata.per_page).toBe(commentsPerPage);
      // expect(postOneCommentsMetadata.has_more).toBeFalsy();
      //
      // const commentWithComment = postOne.comments.data.find(item => item.id === commentOne.id);
      // const commentWithoutComment = postOne.comments.data.find(item => item.id === commentTwo.id);
      //
      // expect(commentWithComment.metadata).toBeDefined();
      // expect(commentWithComment.metadata.next_depth_total_amount).toBe(1);
      //
      // expect(commentWithoutComment.metadata).toBeDefined();
      // expect(commentWithoutComment.metadata.next_depth_total_amount).toBe(0);
      //
      // await CommonHelper.checkPostsListFromApi(
      //   data,
      //   promisesToCreatePosts.length,
      //   options,
      // );
    }, JEST_TIMEOUT);
  });

  describe('Skipped tests', () => {
    it.skip('#smoke - should get valid comment on comment information', async () => {
      // It is mainly tested inside other feed autotests
    });
  });
});

export {};
