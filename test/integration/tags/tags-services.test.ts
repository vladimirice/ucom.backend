export {};

const _ = require('lodash');
const tagsGenerator   = require('../../generators/entity/entity-tags-generator');
const postsGenerator  = require('../../generators/posts-generator');

const mockHelper = require('../helpers/mock-helper');
const seedsHelper = require('../helpers/seeds-helper');

const tagsParser = require('../../../lib/tags/service/tags-parser-service.js');

const tagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');

const postsRepository = require('../../../lib/posts/posts-repository');
const tagsRepository  = require('../../../lib/tags/repository/tags-repository');

let userVlad;
let userJane;

// #task - these are is unit tests
describe('Tags services', () => {
  beforeAll(async () => {
    mockHelper.mockAllTransactionSigning();
    mockHelper.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await seedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  describe('Tags current rate processor', () => {
    it('If only one post and tag is only in this post - post_rate = tag_rate', async () => {
      const firstTag = 'summer';
      // const secondTag = 'autumn';

      const post = await tagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
      );

      const postRate: number = 112.98;

      await postsRepository.setCurrentRateToPost(post.id, postRate);

      await tagsCurrentRateProcessor.process();

      const tag = await tagsRepository.findOneByTitle(firstTag);

      expect(tag.current_rate).toBe(postRate);
    });

    it('If only one posts and two tags - split the rate', async () => {
      const firstTag = 'summer';
      const secondTag = 'autumn';

      const post = await tagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const postRate: number = 112.98;

      await postsRepository.setCurrentRateToPost(post.id, postRate);

      await tagsCurrentRateProcessor.process();

      const firstTagModel = await tagsRepository.findOneByTitle(firstTag);
      expect(firstTagModel.current_rate).toBe(postRate / 2);

      const secondTagModel = await tagsRepository.findOneByTitle(secondTag);
      expect(secondTagModel.current_rate).toBe(postRate / 2);
    });

    it('Three posts, two tags', async () => {
      const firstTag = 'summer';
      const secondTag = 'autumn';

      const allTwoTagsPostOne = await tagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const allTwoTagsPostTwo = await tagsGenerator.createDirectPostForUserWithTags(
        userVlad,
        userJane,
        firstTag,
        secondTag,
      );

      const onlyFirstTagPost = await tagsGenerator.createDirectPostForUserWithTags(
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

      await tagsCurrentRateProcessor.process();

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
      const genData = await tagsGenerator.createPostsWithTags(userVlad, userJane);

      const promises: any = [];
      for (const postId in genData.postsPreview) {
        const post = genData.postsPreview[postId];
        post.current_rate = _.random(100, true).toFixed(10);

        promises.push(
          postsRepository.setCurrentRateToPost(+postId, post.current_rate),
        );
      }

      await Promise.all(promises);

      // post without any tags - should not be processed
      await postsGenerator.createMediaPostByUserHimself(userVlad);

      const posts = await tagsCurrentRateProcessor.process();

      const tags = await tagsRepository.getAllTags();

      tags.forEach((tag) => {
        expect(+tag.current_rate).toBeGreaterThan(0);
      });

      console.dir(posts);
    }, 10000);

    describe('skipped tests', () => {
      it.skip('Tag with rate. Tag is deleted from all posts - tag rate should be 0', async () => {

      });

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
