import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';
import { PostsListResponse } from '../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');

import CommonHelper = require('../helpers/common-helper');

let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;

const JEST_TIMEOUT = 20000;

describe('GET posts via graphql #smoke #posts #graphql', () => {
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

  describe('Positive', () => {
    it('There is no direct post/repost inside posts list because of filter', async () => {
      // TODO
    });

    it('Should work for request from guest #smoke #guest', async () => {
      const vladMediaPostsAmount: number = 3;
      const isMyself: boolean = false;
      const isCommentsEmpty: boolean = true;
      const userVladMediaPosts: number[] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(
          userVlad,
          vladMediaPostsAmount,
        );

      const postFiltering = {
        post_type_id: 1,
      };

      const response: PostsListResponse = await GraphqlHelper.getManyPostsAsGuest(postFiltering);

      CommonHelper.expectPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

      CommonHelper.expectModelsExistence(response.data, userVladMediaPosts);
    });

    it('Check getManyPostsAsMyself endpoint #smoke', async () => {
      const vladMediaPostsAmount: number = 3;
      const isMyself: boolean = true;
      const isCommentsEmpty: boolean = true;
      const userVladMediaPosts: number[] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(
          userVlad,
          vladMediaPostsAmount,
        );

      const postFiltering = {
        post_type_id: 1,
      };

      const response: PostsListResponse = await GraphqlHelper.getManyPostsAsMyself(
        userVlad,
        postFiltering,
      );

      CommonHelper.expectPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

      CommonHelper.expectModelsExistence(response.data, userVladMediaPosts);
    }, JEST_TIMEOUT);

    it('Should work with post comments', async () => {
      // TODO
    });

    describe('Test sorting', () => {
      it('Smoke test. Nothing is found', async () => {
        // const queryString = '?post_type_id=100500&created_at=24_hours&sort_by=-current_rate';
        // const url = `${RequestHelper.getPostsUrl()}${queryString}`;
        // const res = await request(server)
        //   .get(url)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
        //
        // expect(res.body.data.length).toBe(0);
      });

      it('Smoke test. Sort by current rate but only daily', async () => {
        // TODO check query manually or create mocks in DB
        // const queryString = '?post_type_id=1&created_at=24_hours&sort_by=-current_rate';
        // const url = `${RequestHelper.getPostsUrl()}${queryString}`;
        // const res = await request(server)
        //   .get(url)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
      });

      it('sort by current_rate_daily_delta - smoke test', async () => {
        // TODO check query manually or create mocks in DB
        // const url = `${RequestHelper.getPostsUrl()}?sort_by=-current_rate_delta_daily`;
        // const res = await request(server)
        //   .get(url)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
      });

      it('Sort by current_rate DESC', async () => {
        // TODO check query manually or create mocks in DB
        // const url = `${RequestHelper.getPostsUrl()}?sort_by=-current_rate,-id`;
        //
        // const res = await request(server)
        //   .get(url)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
        //
        // const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        // const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');
        //
        // const posts = res.body.data;
        //
        // expect(posts[posts.length - 1].id).toBe(minPostId);
        // expect(posts[0].id).toBe(maxPostId);
      });
      it('Sort by current_rate ASC', async () => {
        // TODO check query manually or create mocks in DB
        // const url = `${RequestHelper.getPostsUrl()}?sort_by=current_rate,-id`;
        //
        // const res = await request(server)
        //   .get(url)
        // ;
        //
        // ResponseHelper.expectStatusOk(res);
        //
        // const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        // const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');
        //
        // const posts = res.body.data;
        //
        // expect(posts[posts.length - 1].id).toBe(maxPostId);
        // expect(posts[0].id).toBe(minPostId);
      });
    });
  });
});

export {};
