import { GraphqlHelper } from '../helpers/graphql-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import CommonHelper = require('../helpers/common-helper');

import ResponseHelper = require('../helpers/response-helper');
import { GraphqlRequestHelper } from '../../helpers/common/graphql-request-helper';

require('cross-fetch/polyfill');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 20000 * 10;

describe('#organizations #feed #graphql', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
    await GraphqlRequestHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlRequestHelper.afterAll(),
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

      // @ts-ignore
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

      const response = await GraphqlHelper.getOrgWallFeedAsMyself(
        userVlad, orgId, feedPage, feedPerPage, commentsPage, commentsPerPage,
      );

      ResponseHelper.checkListResponseStructure(response);

      const posts = response.data;

      expect(posts.length).toBe(2);
      const mediaPostModel = posts.find(item => item.id === orgMediaPostId);
      expect(mediaPostModel).toBeDefined();

      orgMediaComments.forEach((comment: CommentModelResponse) => {
        expect(mediaPostModel!.comments.data.some(item => item.id === comment.id)).toBeTruthy();
      });

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

      CommonHelper.checkOnePostV2(mediaPostModel!, mediaPostOptions);

      const directPostModel = posts.find(item => item.id === orgDirectPost.id);
      expect(directPostModel).toBeDefined();

      directPostComments.forEach((comment: CommentModelResponse) => {
        expect(directPostModel!.comments.data.some(item => item.id === comment.id)).toBeTruthy();
      });

      CommonHelper.checkOnePostV2(directPostModel!, directPostOptions);
    }, JEST_TIMEOUT);
  });

  describe('Skipped tests', () => {
    it.skip('#smoke - should get valid comment on comment information', async () => {
      // It is mainly tested inside other feed autotests
    });
  });
});

export {};
