import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';
import {
  PostModelResponse,
  PostRequestQueryDto,
  PostsListResponse,
} from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');

import CommonHelper = require('../../helpers/common-helper');
import CommentsGenerator = require('../../../generators/comments-generator');
import ResponseHelper = require('../../helpers/response-helper');
import EntityListCategoryDictionary = require('../../../../lib/stats/dictionary/entity-list-category-dictionary');
import _ = require('lodash');
import OrganizationsHelper = require('../../helpers/organizations-helper');
import TagsHelper = require('../../helpers/tags-helper');
import StatsGenerator = require('../../../generators/stats-generator');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 10000;


function checkPostsPage(response, expected) {
  const options = {
    author: {
      myselfData: true,
    },
  };

  expect(_.isEmpty(response.data)).toBeFalsy();

  ResponseHelper.checkResponseOrderingForList(response.data.many_posts, expected.expectedValues, 'post_id');
  ResponseHelper.checkResponseOrderingForList(response.data.many_organizations, expected.expectedForOrg, 'organization_id');
  ResponseHelper.checkResponseOrderingForList(response.data.many_users, expected.expectedForUsers, 'user_id');

  CommonHelper.checkPostListResponseWithoutOrg(response.data.many_posts, true, true);
  CommonHelper.checkUsersListResponse(response.data.many_users, options);
  OrganizationsHelper.checkOrgListResponseStructure(response.data.many_organizations);
}

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'blockchainOnly',
};

describe('GET posts via graphql', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Media Posts trending', () => {
    const overviewType = EntityListCategoryDictionary.getTrending();
    const postTypeId: number = ContentTypeDictionary.getTypeMediaPost();
    const entitiesAmount = 22;
    const expectedOrderBy = 'importance_delta';
    const expectedUsersAmount = 4;
    const expectedOrgsAmount = entitiesAmount / 2 - 1; // -1 due to special org disturbance

    let expected;
    beforeEach(async () => {
      expected = await StatsGenerator.generatePosts(expectedOrderBy, entitiesAmount);
    });

    it('Trending with side blocks. #smoke #posts', async () => {
      const response: any = await GraphqlHelper.getPostsPageAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      checkPostsPage(response, expected);

      expect(response.data.many_organizations.metadata.total_amount).toBe(expectedOrgsAmount);
      expect(response.data.many_users.metadata.total_amount).toBe(expectedUsersAmount);
    }, JEST_TIMEOUT);

    it('Users list for trending post', async () => {
      const response: any = await GraphqlHelper.getPostUsersAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      const options = {
        author: {
          myselfData: true,
        },
      };

      CommonHelper.checkUsersListResponse(response, options);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForUsers, 'user_id');
      expect(response.metadata.total_amount).toBe(expectedUsersAmount);
    });

    it('Users list for trending post - pagination', async () => {
      // #task - very basic smoke test. It is required to check ordering
      const page = 2;

      const response: any = await GraphqlHelper.getPostUsersAsMyself(
        userVlad,
        overviewType,
        postTypeId,
        page,
        2,
      );

      const options = {
        author: {
          myselfData: true,
        },
      };

      CommonHelper.checkUsersListResponse(response, options);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForUsers, 'user_id', page);
    });

    it('Organizations list for trending post', async () => {
      const response: any = await GraphqlHelper.getPostsOrgsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      OrganizationsHelper.checkOrgListResponseStructure(response);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForOrg, 'organization_id');
      expect(response.metadata.total_amount).toBe(expectedOrgsAmount);
    });

    it.skip('Tags list for trending post', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const response: any = await GraphqlHelper.getPostsTagsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      expect(_.isEmpty(response.data)).toBeFalsy();
      TagsHelper.checkTagsListResponseStructure(response);
    });

    it('Trending legacy - sort by current_rate_daily_delta. #smoke #posts', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const postOrdering: string = '-current_rate_delta_daily';
      const response: PostsListResponse = await GraphqlHelper.getManyMediaPostsAsMyself(
        userVlad,
        postOrdering,
      );

      CommonHelper.checkPostListResponseWithoutOrg(response, true, true);
    });
  });

  describe('Media posts hot', () => {
    const overviewType = EntityListCategoryDictionary.getHot();
    const postTypeId: number = ContentTypeDictionary.getTypeMediaPost();

    const entitiesAmount = 22;
    const expectedOrderBy = 'activity_index_delta';
    // const expectedUsersAmount = 4;
    // const expectedOrgsAmount = entitiesAmount / 2 - 1; // -1 due to special org disturbance

    let expected;
    beforeEach(async () => {
      expected = await StatsGenerator.generatePosts(expectedOrderBy, entitiesAmount);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Hot with side blocks. #smoke #posts', async () => {
      const response: any = await GraphqlHelper.getPostsPageAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      checkPostsPage(response, expected);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Users list for hot post', async () => {
      const response: any = await GraphqlHelper.getPostUsersAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      const options = {
        author: {
          myselfData: true,
        },
      };

      CommonHelper.checkUsersListResponse(response, options);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForUsers, 'user_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Organizations list for hot post', async () => {
      const response: any = await GraphqlHelper.getPostsOrgsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      OrganizationsHelper.checkOrgListResponseStructure(response);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForOrg, 'organization_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it.skip('Tags list for hot post', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const response: any = await GraphqlHelper.getPostsTagsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      expect(_.isEmpty(response.data)).toBeFalsy();
      TagsHelper.checkTagsListResponseStructure(response);
    });

    it('Hot legacy - sort by current rate but only daily. #smoke #posts', async () => {
      // #task - very basic smoke test. It is required to check ordering

      // @ts-ignore
      const postFiltering: PostRequestQueryDto = {
        post_type_id: 1,
        created_at: '24_hours',
      };

      const postOrdering: string = '-current_rate';
      const response: PostsListResponse = await GraphqlHelper.getManyPostsAsMyself(
        userVlad,
        postFiltering,
        postOrdering,
      );

      CommonHelper.checkPostListResponseWithoutOrg(response, true, true);
    }, JEST_TIMEOUT);
  });

  describe('Fresh media posts', () => {
    const overviewType = EntityListCategoryDictionary.getFresh();
    const postTypeId: number = ContentTypeDictionary.getTypeMediaPost();

    const entitiesAmount = 22;
    const expectedOrderBy = 'post_id';

    let expected;
    beforeEach(async () => {
      expected = await StatsGenerator.generatePosts(expectedOrderBy, entitiesAmount);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Fresh with side blocks. #smoke #posts', async () => {
      const response: any = await GraphqlHelper.getPostsPageAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      checkPostsPage(response, expected);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Users list for fresh post', async () => {
      const response: any = await GraphqlHelper.getPostUsersAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      const options = {
        author: {
          myselfData: true,
        },
      };

      CommonHelper.checkUsersListResponse(response, options);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForUsers, 'user_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Organizations list for fresh post', async () => {
      const response: any = await GraphqlHelper.getPostsOrgsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      OrganizationsHelper.checkOrgListResponseStructure(response);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForOrg, 'organization_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it.skip('Tags list for fresh post', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const response: any = await GraphqlHelper.getPostsTagsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      expect(_.isEmpty(response.data)).toBeFalsy();
      TagsHelper.checkTagsListResponseStructure(response);
    });
  });

  describe('top media posts', () => {
    const overviewType = EntityListCategoryDictionary.getTop();
    const postTypeId: number = ContentTypeDictionary.getTypeMediaPost();

    const entitiesAmount = 22;
    const expectedOrderBy = 'current_rate';

    let expected;
    beforeEach(async () => {
      expected = await StatsGenerator.generatePosts(expectedOrderBy, entitiesAmount);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Top with side blocks. #smoke #posts', async () => {
      const response: any = await GraphqlHelper.getPostsPageAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      checkPostsPage(response, expected);
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Users list for top post', async () => {
      const response: any = await GraphqlHelper.getPostUsersAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      const options = {
        author: {
          myselfData: true,
        },
      };

      CommonHelper.checkUsersListResponse(response, options);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForUsers, 'user_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('Organizations list for top post', async () => {
      const response: any = await GraphqlHelper.getPostsOrgsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      OrganizationsHelper.checkOrgListResponseStructure(response);
      ResponseHelper.checkResponseOrderingForList(response, expected.expectedForOrg, 'organization_id');
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it.skip('Tags list for top post', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const response: any = await GraphqlHelper.getPostsTagsAsMyself(
        userVlad,
        overviewType,
        postTypeId,
      );

      expect(_.isEmpty(response.data)).toBeFalsy();
      TagsHelper.checkTagsListResponseStructure(response);
    });
  });

  describe('Positive', () => {
    it('Sort by current_rate DESC, ID DESC. #smoke #posts', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const vladMediaPostsAmount: number = 3;
      const userVladMediaPostsIds: number[] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(
          userVlad,
          vladMediaPostsAmount,
        );

      const postOrdering: string = '-current_rate,-id';
      const response: PostsListResponse = await GraphqlHelper.getManyMediaPostsAsMyself(
        userVlad,
        postOrdering,
      );

      CommonHelper.checkPostListResponseWithoutOrg(response, true, true);
      CommonHelper.expectModelsExistence(response.data, userVladMediaPostsIds);
    }, JEST_TIMEOUT);

    it('Sort by current_rate ASC, ID DESC. #smoke #posts', async () => {
      // #task - very basic smoke test. It is required to check ordering

      const vladMediaPostsAmount: number = 3;
      const userVladMediaPostsIds: number[] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(
          userVlad,
          vladMediaPostsAmount,
        );

      const postOrdering: string = 'current_rate,-id';
      const response: PostsListResponse = await GraphqlHelper.getManyMediaPostsAsMyself(
        userVlad,
        postOrdering,
      );

      CommonHelper.checkPostListResponseWithoutOrg(response, true, true);
      CommonHelper.expectModelsExistence(response.data, userVladMediaPostsIds);
    }, JEST_TIMEOUT);

    it('Should work for request from guest #smoke #guest #posts', async () => {
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

      CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

      CommonHelper.expectModelsExistence(response.data, userVladMediaPosts);
    }, JEST_TIMEOUT);

    it('Get many posts as myself endpoint #smoke #myself #posts', async () => {
      const vladMediaPostsAmount: number = 3;
      const isMyself: boolean = true;
      const isCommentsEmpty: boolean = true;
      const userVladMediaPosts: number[] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(
          userVlad,
          vladMediaPostsAmount,
        );

      const response: PostsListResponse = await GraphqlHelper.getManyMediaPostsAsMyself(
        userVlad,
      );

      CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

      CommonHelper.expectModelsExistence(response.data, userVladMediaPosts);
    }, JEST_TIMEOUT);

    it('Should work with post comments. #smoke #posts #comments', async () => {
      const isMyself: boolean = true;
      const isCommentsEmpty: boolean = false;

      const [postOneId, postTwoId] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, 2);

      const [postOneCommentId, postTwoCommentId]: [number, number] = await Promise.all([
        CommentsGenerator.createCommentForPostAndGetId(postOneId, userJane),
        CommentsGenerator.createCommentForPostAndGetId(postTwoId, userJane),
      ]);

      const response: PostsListResponse = await GraphqlHelper.getManyMediaPostsAsMyself(userVlad);

      CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

      CommonHelper.expectModelsExistence(response.data, [postOneId, postTwoId]);

      const postOneResponse: PostModelResponse = response.data.find(item => item.id === postOneId)!;
      CommonHelper.expectModelsExistence(postOneResponse.comments.data, [postOneCommentId]);

      const postTwoResponse: PostModelResponse = response.data.find(item => item.id === postTwoId)!;
      CommonHelper.expectModelsExistence(postTwoResponse.comments.data, [postTwoCommentId]);
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    describe('Test sorting', () => {
      it('Nothing is found - check by non-existing post_type_id. #smoke #posts', async () => {
        // @ts-ignore
        const postFiltering: PostRequestQueryDto = {
          post_type_id: 100500,
        };

        const response: PostsListResponse =
          await GraphqlHelper.getManyPostsAsMyself(userVlad, postFiltering);

        ResponseHelper.checkEmptyResponseList(response);
      });
    });

    it('There is no direct post/repost inside posts list because of filter. #smoke #posts', async () => {
      const { postId, repostId } = await PostsGenerator.createUserPostAndRepost(userVlad, userJane);

      const directPostId: number =
        await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);

      // @ts-ignore
      const postFiltering: PostRequestQueryDto = {
        post_type_id: 1,
      };

      const response: PostsListResponse = await GraphqlHelper.getManyPostsAsGuest(postFiltering);

      CommonHelper.expectModelsExistence(response.data, [postId]);
      CommonHelper.expectModelsDoNotExist(response.data, [repostId, directPostId]);
    });
  });
});

export {};
