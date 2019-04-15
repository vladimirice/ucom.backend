import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

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
// @ts-ignore
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

  // @ts-ignore
  const fieldName = EntityImagesModelProvider.entityImagesColumn();

  describe('Positive', () => {
    it('Create media post without any images', async () => {
      const myself = userVlad;

      const newPostFields = {
        title: 'Extremely new post',
        description: 'Our super post description',
        leading_text: 'extremely leading text',
        post_type_id: ContentTypeDictionary.getTypeMediaPost(),

        entity_images: null,
        main_image_filename: null,
      };

      const res = await request(server)
        .post(RequestHelper.getPostsUrl())
        .set('Authorization', `Bearer ${myself.token}`)
        .field('title', newPostFields.title)
        .field('description', newPostFields.description)
        .field('post_type_id', newPostFields.post_type_id)
        .field('leading_text', newPostFields.leading_text)
        .field('entity_images', '')
      ;

      ResponseHelper.expectStatusOk(res);

      const posts = await PostsHelper.requestToGetManyPostsAsGuest();
      const newPost = posts.find(data => data.title === newPostFields.title);

      expect(newPost).toMatchObject(newPostFields);
    }, JEST_TIMEOUT);

    it('Create media post with entity_images', async () => {
      const myself = userVlad;

      const newPostFields = {
        title: 'Extremely new post',
        description: 'Our super post description',
        leading_text: 'extremely leading text',
        post_type_id: ContentTypeDictionary.getTypeMediaPost(),
        entity_images: {
          article_title: [
            {
              url: 'http://localhost:3000/upload/sample_filename_5.jpg',
            },
          ],
        },
      };

      const res = await request(server)
        .post(RequestHelper.getPostsUrl())
        .set('Authorization', `Bearer ${myself.token}`)
        .field('title', newPostFields.title)
        .field('description', newPostFields.description)
        .field('post_type_id', newPostFields.post_type_id)
        .field('leading_text', newPostFields.leading_text)
        .field('entity_images', JSON.stringify(newPostFields.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const posts = await PostsHelper.requestToGetManyPostsAsGuest();

      // const posts = await PostsRepository.findAllByAuthor(myself.id);
      const newPost = posts.find(data => data.title === newPostFields.title);
      expect(newPost).toBeDefined();

      expect(newPost.main_image_filename).toBeNull();

      PostsHelper.checkEntityImages(newPost);

      expect(newPost).toMatchObject(newPostFields);
    });

    it('Update Media Post and also update entity_images', async () => {
      await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);
      // await PostsHelper.makeFieldNull(firstPostBefore.id, 'main_image_filename');

      const fieldsToChange = {
        title: 'This is title to change',
        description: 'Also necessary to change description',
        leading_text: 'And leading text',
        entity_images: {
          article_title: [
            {
              url: 'http://localhost:3000/upload/sample_filename_5.jpg',
            },
          ],
        },
      };

      const res = await request(server)
        .patch(`${RequestHelper.getPostsUrl()}/${firstPostBefore.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange.title)
        .field('description',   fieldsToChange.description)
        .field('leading_text',  fieldsToChange.leading_text)
        .field('entity_images',  JSON.stringify(fieldsToChange.entity_images))
      ;

      ResponseHelper.expectStatusOk(res);

      const postAfter =
        await PostsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

      PostsHelper.validatePatchResponse(res, postAfter);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, postAfter);

      // entity_images field do not change main_image_filename
      expect(firstPostBefore.main_image_filename).toBe(postAfter.main_image_filename);

      PostsHelper.checkEntityImages(postAfter);
    });
  });
});

export {};
