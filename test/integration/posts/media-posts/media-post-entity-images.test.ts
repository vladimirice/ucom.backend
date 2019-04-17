import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';
import { PostModelResponse } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import EntityImagesModelProvider = require('../../../../lib/entity-images/service/entity-images-model-provider');
import ResponseHelper = require('../../helpers/response-helper');
import RequestHelper = require('../../helpers/request-helper');
import PostsHelper = require('../../helpers/posts-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsRepository = require('../../../../lib/posts/posts-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const request = require('supertest');

const server = require('../../../../app');

let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

describe('media posts entity images', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  const fieldName = EntityImagesModelProvider.entityImagesColumn();

  describe('Create media post with entity images', () => {
    describe('Positive', () => {
      it('Create media post without any images', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),

          [fieldName]: {},
        };

        const res = await request(server)
          .post(RequestHelper.getPostsUrl())
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
          .field(fieldName, '{}')
        ;

        ResponseHelper.expectStatusOk(res);

        const posts = await GraphqlHelper.getManyMediaPostsAsMyself(myself);
        const newPost: PostModelResponse | undefined = posts.data.find(data => data.title === newPostFields.title);

        expect(newPost).toMatchObject(newPostFields);

        PostsHelper.checkEntityImages(newPost!);

        ResponseHelper.expectEmptyObject(newPost![fieldName]);
      }, JEST_TIMEOUT);
      it('Create media post without any images - do not pass entity_images at all', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
        };

        const res = await request(server)
          .post(RequestHelper.getPostsUrl())
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
          .field(fieldName, '{}')
        ;

        ResponseHelper.expectStatusOk(res);

        const posts = await GraphqlHelper.getManyMediaPostsAsMyself(myself);
        const newPost: PostModelResponse | undefined = posts.data.find(data => data.title === newPostFields.title);

        expect(newPost).toMatchObject(newPostFields);

        PostsHelper.checkEntityImages(newPost!);

        ResponseHelper.expectEmptyObject(newPost![fieldName]);
      }, JEST_TIMEOUT);
      it('Create media post with entity_images', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          [fieldName]: {
            something: [
              {
                some_url_key: 'http://localhost:3000/upload/sample_filename_5.jpg',
                comment: '12345',
              },
            ],
            another_key: {
              success: true,
            },
          },
        };

        const res = await request(server)
          .post(RequestHelper.getPostsUrl())
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
          .field(fieldName, JSON.stringify(newPostFields.entity_images))
        ;

        ResponseHelper.expectStatusOk(res);

        const posts = await PostsHelper.requestToGetManyPostsAsGuest();

        const newPost = posts.find(data => data.title === newPostFields.title);
        ResponseHelper.expectNotEmpty(newPost);

        PostsHelper.checkEntityImages(newPost);

        expect(newPost).toMatchObject(newPostFields);
      });
    });
  });

  describe('Update media post with entity images', () => {
    it('Update Media Post and also update entity_images. From empty to filled', async () => {
      await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);

      const fieldsToChange = {
        title: 'This is title to change',
        description: 'Also necessary to change description',
        leading_text: 'And leading text',
        [fieldName]: {
          something: [
            {
              some_url_key: 'http://localhost:3000/upload/sample_filename_5.jpg',
              comment: '12345',
            },
          ],
          another_key: {
            success: true,
          },
        },
      };

      const res = await request(server)
        .patch(`${RequestHelper.getPostsUrl()}/${firstPostBefore.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange.title)
        .field('description',   fieldsToChange.description)
        .field('leading_text',  fieldsToChange.leading_text)
        .field(fieldName,  JSON.stringify(fieldsToChange.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const postAfter =
        await PostsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

      PostsHelper.validatePatchResponse(res, postAfter);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, postAfter);
      PostsHelper.checkEntityImages(postAfter);
    });
  });
});

export {};
