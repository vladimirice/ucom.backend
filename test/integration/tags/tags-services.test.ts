import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import PostsHelper = require('../helpers/posts-helper');
import TagsHelper = require('../helpers/tags-helper');

const _ = require('lodash');

const tagsParser = require('../../../lib/tags/service/tags-parser-service.js');

const postsRepository = require('../../../lib/posts/posts-repository');
const tagsRepository  = require('../../../lib/tags/repository/tags-repository');

let userVlad;
let userJane;

// #task - these are is unit tests
describe('Tags services', () => {
  beforeAll(async () => {
    MockHelper.mockAllTransactionSigning();
    MockHelper.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Tags current rate processor', () => {
    it('Check current_posts_amount', async () => {
      const tagOneTitle = 'summer';
      const tagTwoTitle = 'autumn';

      await Promise.all([
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),

        EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle),
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle),
      ]);

      await TagsCurrentRateProcessor.process();

      const tagOneModel = await TagsRepository.findOneByTitle(tagOneTitle);
      const tagTwoModel = await TagsRepository.findOneByTitle(tagTwoTitle);

      expect(tagOneModel!.current_posts_amount).toBe(2);
      expect(tagTwoModel!.current_posts_amount).toBe(2);

      await EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle);
      await TagsCurrentRateProcessor.process();
      const tagOneModelAfterEvent = await TagsRepository.findOneByTitle(tagOneTitle);
      expect(tagOneModelAfterEvent!.current_posts_amount).toBe(3);
    });

    it('Posts amount and current_rate should become 0 if no post remained', async () => {
      const tagOneTitle = 'summer';
      const tagTwoTitle = 'autumn';

      const postId = await EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle);
      const postTwoId = await EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle);

      const tagOneRate = 0.432;
      const tagTwoRate = 0.23213;
      await PostsHelper.setSampleRateToPost(postId, tagOneRate);
      await PostsHelper.setSampleRateToPost(postTwoId, tagTwoRate);
      await TagsCurrentRateProcessor.process();

      const tagModelBefore = await TagsRepository.findOneByTitle(tagOneTitle);
      expect(tagModelBefore!.current_posts_amount).toBe(1);
      expect(tagModelBefore!.current_rate).toBe(tagOneRate);

      await PostsHelper.requestToUpdatePostDescriptionV2(
        postId,
        userVlad,
        'desc without tags',
      );
      await TagsHelper.getPostWhenTagsAreUpdated(postId, []);

      await TagsCurrentRateProcessor.process();

      const tagModelAfter = await TagsRepository.findOneByTitle(tagOneTitle);
      expect(tagModelAfter!.current_posts_amount).toBe(0);
      expect(tagModelAfter!.current_rate).toBe(0);

      const tagTwoModelAfter = await TagsRepository.findOneByTitle(tagTwoTitle);
      expect(tagTwoModelAfter!.current_posts_amount).toBe(1);
      expect(tagTwoModelAfter!.current_rate).toBe(tagTwoRate);
    });

    it('should decrease stats from some value to zero', async () => {
      const tagOneTitle = 'summer';

      const postId = await EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle);

      const tagOneRate = 0.432;
      await PostsHelper.setSampleRateToPost(postId, tagOneRate);
      await TagsCurrentRateProcessor.process();

      const tagModelBefore = await TagsRepository.findOneByTitle(tagOneTitle);
      expect(tagModelBefore!.current_posts_amount).toBe(1);
      expect(tagModelBefore!.current_rate).toBe(tagOneRate);

      await PostsHelper.requestToUpdatePostDescriptionV2(
        postId,
        userVlad,
        'desc without tags',
      );
      await TagsHelper.getPostWhenTagsAreUpdated(postId, []);

      await TagsCurrentRateProcessor.process();

      const tagModelAfter = await TagsRepository.findOneByTitle(tagOneTitle);
      expect(tagModelAfter!.current_posts_amount).toBe(0);
      expect(tagModelAfter!.current_rate).toBe(0);
    });

    it('If only one post and tag is only in this post - post_rate = tag_rate', async () => {
      const firstTag = 'summer';
      // const secondTag = 'autumn';

      const post = await EntityTagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
      );

      const postRate: number = 112.98;

      await postsRepository.setCurrentRateToPost(post.id, postRate);

      await TagsCurrentRateProcessor.process();

      const tag = await tagsRepository.findOneByTitle(firstTag);

      expect(tag.current_rate).toBe(postRate);
    });

    it('If only one posts and two tags - split the rate', async () => {
      const firstTag = 'summer';
      const secondTag = 'autumn';

      const post = await EntityTagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const postRate: number = 112.98;

      await postsRepository.setCurrentRateToPost(post.id, postRate);

      await TagsCurrentRateProcessor.process();

      const firstTagModel = await tagsRepository.findOneByTitle(firstTag);
      expect(firstTagModel.current_rate).toBe(postRate / 2);

      const secondTagModel = await tagsRepository.findOneByTitle(secondTag);
      expect(secondTagModel.current_rate).toBe(postRate / 2);
    });

    it('Three posts, two tags', async () => {
      const firstTag = 'summer';
      const secondTag = 'autumn';

      const allTwoTagsPostOne = await EntityTagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const allTwoTagsPostTwo = await EntityTagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const onlyFirstTagPost = await EntityTagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
      );

      onlyFirstTagPost.current_rate = 231.94;
      allTwoTagsPostOne.current_rate = 318.62;
      allTwoTagsPostTwo.current_rate = 4462.13;

      await Promise.all([
        postsRepository.setCurrentRateToPost(onlyFirstTagPost.id, onlyFirstTagPost.current_rate),
        postsRepository.setCurrentRateToPost(allTwoTagsPostOne.id, allTwoTagsPostOne.current_rate),
        postsRepository.setCurrentRateToPost(allTwoTagsPostTwo.id, allTwoTagsPostTwo.current_rate),
      ]);

      await TagsCurrentRateProcessor.process();

      const expectedFirstTagRate =
        (onlyFirstTagPost.current_rate +
        allTwoTagsPostOne.current_rate / 2 +
        allTwoTagsPostTwo.current_rate / 2) / 3;

      const expectedSecondTagRate =
        (allTwoTagsPostOne.current_rate / 2 +
        allTwoTagsPostTwo.current_rate / 2) / 2;

      const firstTagModel = await tagsRepository.findOneByTitle(firstTag);
      expect(firstTagModel.current_rate).toBe(expectedFirstTagRate);

      const secondTagModel = await tagsRepository.findOneByTitle(secondTag);
      expect(secondTagModel.current_rate).toBe(expectedSecondTagRate);
    });

    it('[Smoke] Process rates of given posts', async () => {
      const genData = await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);

      const promises: any = [];
      for (const postId in genData.postsPreview) {
        if (!genData.postsPreview.hasOwnProperty(postId)) {
          continue;
        }

        const post = genData.postsPreview[postId];
        post.current_rate = _.random(100, true).toFixed(10);

        promises.push(
          postsRepository.setCurrentRateToPost(+postId, post.current_rate),
        );
      }

      await Promise.all(promises);

      // post without any tags - should not be processed
      await PostsGenerator.createMediaPostByUserHimself(userVlad);

      await TagsCurrentRateProcessor.process();

      const tags = await tagsRepository.getAllTags();

      tags.forEach((tag) => {
        expect(+tag.current_rate).toBeGreaterThan(0);
      });
    }, 10000);

    describe('skipped tests', () => {
      it.skip('Tag with rate. Related posts rate is 0. tag rate should be 0', async () => {
      });
    });
  });

  describe('Tags parser', () => {
    it('Tags parser basic checks', async () => {
      const data = {
        '#null#undefined!#undefined2!# #a #b2 # hello! #a998bc' : [
          'null', 'undefined', 'undefined2', 'a', 'b2', 'a998bc',
        ],
        ' I #am__az_ing_ #1tool:) #too.l #_9abc:)' : [
          'am__az_ing_', 'too',
        ],
        '#null#null## hello there! I am amazing' : ['null'],
        '#null2 hello! #undefined! I #ama2zing90 #1tool:)' : ['null2', 'undefined', 'ama2zing90'],
        '#nUll2 hell #heLLo! #UOSNetwork #uosnetwork #UOSnetwork #UosNetwork' : [
          'hello', 'null2', 'uosnetwork',
        ],
        'hello from no tags': [],
        '': [],
      };

      for (const input in data) {
        if (!data.hasOwnProperty(input)) {
          continue;
        }

        const expected = data[input];
        const actual = tagsParser.parseTags(input);

        expect(actual.length).toBe(expected.length);
        expect(actual.sort()).toEqual(expected.sort());
      }
    });

    it('If description is not provided then no tags', async () => {
      const actual = tagsParser.parseTags(null);

      expect(Array.isArray(actual)).toBeTruthy();
      expect(actual.length).toBe(0);
    });
  });
});

export {};
