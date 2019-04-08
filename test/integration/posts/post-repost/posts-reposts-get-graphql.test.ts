import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';
import {
  PostModelResponse,
  PostRequestQueryDto,
  PostsListResponse,
} from '../../../../lib/posts/interfaces/model-interfaces';

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');

import CommonHelper = require('../../helpers/common-helper');
import { GraphqlRequestHelper } from '../../../helpers/common/graphql-request-helper';

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 10000;

describe('GET one or many reposts via graphql', () => {
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
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  describe('Many reposts', () => {
    describe('Positive', () => {
      it('Reposts list - should contain post.post and entity card info. #smoke #posts #reposts', async () => {
        const { repostId: repostOneId } =
          await PostsGenerator.createUserPostAndRepost(userVlad, userJane);
        const { repostId: repostTwoId } =
          await PostsGenerator.createUserPostAndRepost(userVlad, userJane);

        // @ts-ignore
        const postFiltering: PostRequestQueryDto = {
          post_type_id: 11,
        };

        const postOrdering: string = '-current_rate';
        const response: PostsListResponse = await GraphqlHelper.getManyPostsAsMyself(
          userVlad,
          postFiltering,
          postOrdering,
        );

        CommonHelper.expectModelsExistence(response.data, [repostTwoId, repostOneId]);
        CommonHelper.checkPostListResponseWithoutOrg(response, true, true, false);
      }, JEST_TIMEOUT);
    });
  });

  describe('One repost', () => {
    describe('Positive', () => {
      it('Get one direct post as myself. #smoke #posts #direct-post', async () => {
        const { postId, repostId } =
          await PostsGenerator.createUserPostAndRepost(userVlad, userJane);
        const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, repostId);

        expect(post.post_type_id).toBe(ContentTypeDictionary.getTypeRepost());
        CommonHelper.checkOnePostV2WithoutOrg(post, true, false, true);

        expect(post.post!.id).toBe(postId);
      });
    });
  });
});

export {};
