import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';
import { PostModelResponse } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import EntityImagesModelProvider = require('../../../../lib/entity-images/service/entity-images-model-provider');
import ResponseHelper = require('../../helpers/response-helper');
import RequestHelper = require('../../helpers/request-helper');
import PostsHelper = require('../../helpers/posts-helper');
import PostsGenerator = require('../../../generators/posts-generator');

const request = require('supertest');

const server = require('../../../../app');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

describe('direct posts entity images', () => {
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

  describe('Create direct post with entity images', () => {
    describe('Positive', () => {
      it('Create direct post without any images', async () => {
        const myself = userVlad;

        const givenFields = {
          description: 'Our super post description',
          [fieldName]: {},
          main_image_filename: '',
        };

        const directPost =
          await PostsGenerator.createDirectPostForUserWithFields(userVlad, userJane, givenFields);

        const posts = await GraphqlHelper.getManyDirectPostsAsMyself(myself);
        const newPost: PostModelResponse | undefined = posts.data.find(data => data.id === directPost.id);

        expect(newPost).toMatchObject(givenFields);

        PostsHelper.checkEntityImages(newPost!);
        ResponseHelper.expectEmptyObject(newPost![fieldName]);
      }, JEST_TIMEOUT);

      it('Create direct post without any images - do not pass entity_images at all', async () => {
        const myself = userVlad;

        const givenFields = {
          description: 'Our super post description',
        };

        const directPost =
          await PostsGenerator.createDirectPostForUserWithFields(userVlad, userJane, givenFields);

        const posts = await GraphqlHelper.getManyDirectPostsAsMyself(myself);
        const newPost: PostModelResponse | undefined = posts.data.find(data => data.id === directPost.id);

        expect(newPost).toMatchObject(givenFields);

        PostsHelper.checkEntityImages(newPost!);
        ResponseHelper.expectEmptyObject(newPost![fieldName]);
      }, JEST_TIMEOUT);

      it('Create direct post with entity_images', async () => {
        const myself = userVlad;

        const givenFields = {
          description: 'Our super post description',
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

        const directPost =
          await PostsGenerator.createDirectPostForUserWithFields(userVlad, userJane, givenFields);

        const posts = await GraphqlHelper.getManyDirectPostsAsMyself(myself);

        const newPost = posts.data.find(data => data.id === directPost.id);
        ResponseHelper.expectNotEmpty(newPost);

        expect(newPost!.main_image_filename).toBeNull();

        PostsHelper.checkEntityImages(newPost!);

        expect(newPost).toMatchObject(givenFields);
      });
    });
  });

  describe('Update media post with entity images', () => {
    it('Update direct post and also update empty entity_images', async () => {
      const firstPostBefore: PostModelResponse =
        await PostsGenerator.createUserDirectPostForOtherUserV2(userVlad, userJane);

      const fieldsToChange = {
        description: 'Also necessary to change description',
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
        .field('description',   fieldsToChange.description)
        .field(fieldName,  JSON.stringify(fieldsToChange.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const posts = await GraphqlHelper.getManyDirectPostsAsMyself(userVlad);
      const newPost = posts.data.find(data => data.id === firstPostBefore.id);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, newPost);

      PostsHelper.checkEntityImages(newPost!);
    });

    it('change existing entity_images', async () => {
      const givenFields = {
        description: 'Our super post description',
        [fieldName]: {
          another_key12345: {
            success: true,
          },
        },
        main_image_filename: '',
      };

      const firstPostBefore =
        await PostsGenerator.createDirectPostForUserWithFields(userVlad, userJane, givenFields);

      ResponseHelper.expectValuesAreExpected(givenFields, firstPostBefore);

      const fieldsToChange = {
        description: 'Also necessary to change description',
        [fieldName]: {
          something: [
            {
              some_url_key: 'http://localhost:3000/upload/sample_filename_5.jpg',
              comment: '12345',
            },
          ],
        },
      };

      const res = await request(server)
        .patch(`${RequestHelper.getPostsUrl()}/${firstPostBefore.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange.description)
        .field(fieldName,  JSON.stringify(fieldsToChange.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const posts = await GraphqlHelper.getManyDirectPostsAsMyself(userVlad);
      const newPost = posts.data.find(data => data.id === firstPostBefore.id);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, newPost);

      PostsHelper.checkEntityImages(newPost!);
    }, JEST_TIMEOUT);

    it('Clear entity_images - pass empty object', async () => {
      const givenFields = {
        description: 'Our super post description',
        [fieldName]: {
          another_key12345: {
            success: true,
          },
        },
        main_image_filename: '',
      };

      const firstPostBefore =
        await PostsGenerator.createDirectPostForUserWithFields(userVlad, userJane, givenFields);

      ResponseHelper.expectValuesAreExpected(givenFields, firstPostBefore);

      const fieldsToChange = {
        [fieldName]: {},
      };

      const res = await request(server)
        .patch(`${RequestHelper.getPostsUrl()}/${firstPostBefore.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field(fieldName,  JSON.stringify(fieldsToChange.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const posts = await GraphqlHelper.getManyDirectPostsAsMyself(userVlad);
      const newPost = posts.data.find(data => data.id === firstPostBefore.id);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, newPost);

      PostsHelper.checkEntityImages(newPost!);
    }, JEST_TIMEOUT);
  });
});

export {};
