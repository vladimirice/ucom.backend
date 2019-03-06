import { GraphqlHelper } from '../helpers/graphql-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { PostModelResponse, PostsListResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import ResponseHelper = require('../helpers/response-helper');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import MockHelper = require('../helpers/mock-helper');
import CommentsGenerator = require('../../generators/comments-generator');
import CommonHelper = require('../helpers/common-helper');

require('cross-fetch/polyfill');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 20000;

MockHelper.mockAllTransactionSigning();
MockHelper.mockAllBlockchainJobProducers();

describe('#tags #feed #graphql', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
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
    it('#smoke - should get all tags-related posts', async () => {
      const generated: any = await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);
      const tagName: string = generated.tagsTitles[0];

      const expectedPostsIds: number[] = generated.tagNameToPostsIds[tagName];
      const postOneId: number = expectedPostsIds[0];
      const postTwoId: number = expectedPostsIds[1];

      const postOneCommentId: number =
        await CommentsGenerator.createCommentForPostAndGetId(postOneId, userJane);

      const postTwoCommentId: number =
        await CommentsGenerator.createCommentForPostAndGetId(postTwoId, userJane);

      const response: PostsListResponse =
        await GraphqlHelper.getTagWallFeedAsMyself(userVlad, tagName);

      ResponseHelper.checkListResponseStructure(response);

      const posts: PostModelResponse[] = response.data;
      expect(posts.length).toBe(expectedPostsIds.length);

      posts.forEach((post) => {
        expect(~expectedPostsIds.indexOf(post.id)).toBeTruthy();
        expect(post.entity_tags).not.toBeNull();
        expect(~post.entity_tags.indexOf(tagName)).toBeTruthy();
      });

      const postOneResponse: PostModelResponse = posts.find(item => item.id === postOneId)!;
      expect(postOneResponse.comments.data.some(item => item.id === postOneCommentId)).toBeTruthy();

      const postTwoResponse: PostModelResponse = posts.find(item => item.id === postTwoId)!;
      expect(postTwoResponse.comments.data.some(item => item.id === postTwoCommentId)).toBeTruthy();

      const manyPostsOptions: CheckerOptions = {
        model: {
          myselfData: true,
        },
        postProcessing: 'list',
      };
      CommonHelper.checkManyPostsV2(posts, manyPostsOptions);

      const postWithCommentsOptions: CheckerOptions = {
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

      CommonHelper.checkOnePostV2(postOneResponse, postWithCommentsOptions);
      CommonHelper.checkOnePostV2(postTwoResponse, postWithCommentsOptions);
    }, JEST_TIMEOUT);
  });

  describe('Skipped tests', () => {
    it.skip('#smoke - should get valid comment on comment information', async () => {
      // It is mainly tested inside other feed autotests
    });
  });
});

export {};
