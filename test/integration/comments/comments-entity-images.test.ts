import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import ResponseHelper = require('../helpers/response-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import EntityImagesModelProvider = require('../../../lib/entity-images/service/entity-images-model-provider');
import EntityImagesGenerator = require('../../generators/common/entity-images-generator');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

describe('Comments entity images', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  const fieldName = EntityImagesModelProvider.entityImagesColumn();

  describe('Positive', () => {
    it('Create new comment without entity_images - should be empty object field', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

      ResponseHelper.expectEmptyObject(comment);
    }, JEST_TIMEOUT);

    it('Create new comment for post with entity images', async () => {
      const sampleEntityImages = EntityImagesGenerator.getSampleEntityImagesValue();

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const comment = await CommentsGenerator.createCommentForPost(postId, userJane, undefined, sampleEntityImages);

      ResponseHelper.expectNotEmptyEntityField(comment, fieldName);

      expect(comment[fieldName]).toMatchObject(sampleEntityImages);
    });

    it('Create reply with empty entity images', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const parentCommentId = await CommentsGenerator.createCommentForPostAndGetId(postId, userJane);

      const reply: CommentModelResponse = await CommentsGenerator.createCommentOnComment(postId, parentCommentId, userVlad);
      ResponseHelper.expectEmptyObject(reply[fieldName]);
    });

    it('Create reply with given entity images', async () => {
      const sampleEntityImages = EntityImagesGenerator.getSampleEntityImagesValue();

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const parentCommentId = await CommentsGenerator.createCommentForPostAndGetId(postId, userJane);

      const reply: CommentModelResponse = await CommentsGenerator.createCommentOnComment(
        postId,
        parentCommentId,
        userVlad,
        undefined,
        sampleEntityImages,
      );

      ResponseHelper.expectEmptyObject(reply[fieldName]);

      ResponseHelper.expectNotEmptyEntityField(reply, fieldName);

      expect(reply[fieldName]).toMatchObject(sampleEntityImages);
    });
  });

  describe('Negative', () => {
    it('Malformed entity_images JSON', async () => {
      const malformed = '{ { ]malformed]';

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      await CommentsGenerator.createCommentForPost(postId, userJane, undefined, malformed, 400);
    });
    it('Entity images is a string, not JSON object', async () => {
      const malformed = 'https://example.com';

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      await CommentsGenerator.createCommentForPost(postId, userJane, undefined, malformed, 400);
    });

    it('Entity images string is too big', async () => {
      const sampleEntityImages = EntityImagesGenerator.getSampleVeryBigEntityImagesValue();

      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      await CommentsGenerator.createCommentForPost(postId, userJane, undefined, sampleEntityImages, 400);
    });
  });

  describe('Skipped', () => {
    it.skip('Update empty to value for comment', async () => {
      // there is no update feature for comments
    });

    it.skip('Update value to empty for comment', async () => {
      // there is no update feature for comments
    });

    it.skip('Update empty to value for reply', async () => {
      // there is no update feature for comments
    });

    it.skip('Update value to empty for reply', async () => {
      // there is no update feature for comments
    });
  });
});

export {};
