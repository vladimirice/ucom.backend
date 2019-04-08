import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import { GraphqlHelper } from '../../helpers/graphql-helper';
import {
  PostModelMyselfResponse, PostModelResponse, PostRequestQueryDto,
  PostsListResponse,
} from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import UsersHelper = require('../../helpers/users-helper');
import _ = require('lodash');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import OrganizationsModelProvider = require('../../../../lib/organizations/service/organizations-model-provider');
import OrganizationsHelper = require('../../helpers/organizations-helper');
import CommonHelper = require('../../helpers/common-helper');
import CommentsGenerator = require('../../../generators/comments-generator');
import { GraphqlRequestHelper } from '../../../helpers/common/graphql-request-helper';

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const JEST_TIMEOUT = 10000;

describe('#posts #direct #get #graphql', () => {
  beforeAll(async () => {
    await GraphqlRequestHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlRequestHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine(true);
  });

  describe('Get many direct posts', () => {
    describe('Positive', () => {
      describe('Test trending and hot', () => {
        it('Smoke, hot for direct posts. Check only that there is no graphql client errors. #smoke #posts', async () => {
          // #task - very basic smoke test. It is required to check ordering
          // @ts-ignore
          const postFiltering: PostRequestQueryDto = {
            post_type_id: 2,
            created_at: '24_hours',
          };

          const postOrdering: string = '-current_rate';
          await GraphqlHelper.getManyPostsAsMyself(
            userVlad,
            postFiltering,
            postOrdering,
          );
        }, JEST_TIMEOUT);

        it('Smoke, Trending for direct posts. Check only that there is no graphql client errors.', async () => {
          // #task - very basic smoke test. It is required to check ordering
          const postOrdering: string = '-current_rate_delta_daily';

          // @ts-ignore
          const postFiltering: PostRequestQueryDto = {
            post_type_id: 2,
          };

          await GraphqlHelper.getManyPostsAsMyself(
            userVlad,
            postFiltering,
            postOrdering,
          );
        }, JEST_TIMEOUT);
      });

      it('Get many direct posts as myself #smoke #myself #posts #direct-posts', async () => {
        const directPostsAmount: number = 3;
        const isMyself: boolean = true;
        const isCommentsEmpty: boolean = true;

        const janePostsIds: number[] = await PostsGenerator.createManyDirectPostsForUserAndGetIds(
          userJane,
          userVlad,
          directPostsAmount,
        );

        const petrPostsIds: number[] = await PostsGenerator.createManyDirectPostsForUserAndGetIds(
          userPetr,
          userJane,
          directPostsAmount,
        );

        const response: PostsListResponse =
          await GraphqlHelper.getManyDirectPostsAsMyself(userVlad);

        CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

        CommonHelper.expectModelsExistence(
          response.data,
          Array.prototype.concat(janePostsIds, petrPostsIds),
        );
      }, JEST_TIMEOUT);

      it('Should work with post comments. #smoke #posts #direct-posts #comments', async () => {
        const isMyself: boolean = true;
        const isCommentsEmpty: boolean = false;

        const janeDirectPostId: number =
          await PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad);

        const petrDirectPostId: number =
          await PostsGenerator.createDirectPostForUserAndGetId(userPetr, userJane);

        const [postOneCommentId, postTwoCommentId]: [number, number] = await Promise.all([
          CommentsGenerator.createCommentForPostAndGetId(janeDirectPostId, userVlad),
          CommentsGenerator.createCommentForPostAndGetId(petrDirectPostId, userJane),
        ]);

        const response: PostsListResponse =
          await GraphqlHelper.getManyDirectPostsAsMyself(userVlad);

        CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

        CommonHelper.expectModelIdsExistenceInResponseList(
          response,
          [janeDirectPostId, petrDirectPostId],
        );

        const postOneResponse: PostModelResponse =
          response.data.find(item => item.id === janeDirectPostId)!;
        CommonHelper.expectModelsExistence(postOneResponse.comments.data, [postOneCommentId]);

        const postTwoResponse: PostModelResponse =
          response.data.find(item => item.id === petrDirectPostId)!;
        CommonHelper.expectModelsExistence(postTwoResponse.comments.data, [postTwoCommentId]);
      }, JEST_TIMEOUT);

      it('Should work for request from guest #smoke #guest #posts', async () => {
        const directPostsAmount: number = 3;
        const isMyself: boolean = false;
        const isCommentsEmpty: boolean = true;

        const janePostsIds: number[] = await PostsGenerator.createManyDirectPostsForUserAndGetIds(
          userJane,
          userVlad,
          directPostsAmount,
        );

        const petrPostsIds: number[] = await PostsGenerator.createManyDirectPostsForUserAndGetIds(
          userPetr,
          userJane,
          directPostsAmount,
        );

        const postFiltering = {
          post_type_id: ContentTypeDictionary.getTypeDirectPost(),
        };

        const response: PostsListResponse = await GraphqlHelper.getManyPostsAsGuest(postFiltering);

        CommonHelper.checkPostListResponseWithoutOrg(response, isMyself, isCommentsEmpty);

        CommonHelper.expectModelIdsExistenceInResponseList(
          response,
          Array.prototype.concat(janePostsIds, petrPostsIds),
        );
      }, JEST_TIMEOUT);
    });
  });

  describe('Get one direct post', () => {
    describe('Positive', () => {
      it('Get one direct post for user - should be related FOR info. #posts #users', async () => {
        const postId: number =
          await PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad);

        const post: PostModelMyselfResponse =
          await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

        expect(post.entity_name_for).toBeDefined();
        expect(post.entity_name_for).toBe(UsersModelProvider.getEntityName());

        expect(post.entity_id_for).toBeDefined();
        expect(+post.entity_id_for).toBe(userVlad.id);

        expect(_.isEmpty(post.entity_for_card)).toBeFalsy();
        expect(post.entity_for_card.id).toBe(userVlad.id);

        UsersHelper.checkUserPreview(post.entity_for_card);

        CommonHelper.checkOnePostV2WithoutOrg(post, true, true, true);
      }, JEST_TIMEOUT);

      it('direct post should contain related wall entity info. #smoke #posts #organizations', async () => {
        const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId: number =
          await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, orgId);

        const post: PostModelMyselfResponse =
          await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

        expect(post.entity_name_for).toBeDefined();
        expect(post.entity_name_for).toBe(OrganizationsModelProvider.getEntityName());

        expect(post.entity_id_for).toBeDefined();
        expect(+post.entity_id_for).toBe(orgId);

        expect(_.isEmpty(post.entity_for_card)).toBeFalsy();

        OrganizationsHelper.checkOneOrganizationCardStructure(post.entity_for_card);
        expect(post.entity_for_card.id).toBe(orgId);
      }, JEST_TIMEOUT);
    });
  });
});

export {};
