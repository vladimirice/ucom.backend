export {};

const _     = require('lodash');
const delay = require('delay');

const gen     = require('../../generators');
const helpers = require('../helpers');

let userVlad;
let userJane;

describe('Tags parser consumer', () => {
  beforeAll(async () => {
    helpers.Mock.mockAllTransactionSigning();
    helpers.Mock.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Should create org post and have an appropriate org_id in entity_tags', async () => {
      const orgId = await gen.Org.createOrgWithoutTeam(userVlad);

      const postTags = [
        'summer',
        'undefined',
      ];

      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId, {
        description: `Hi everyone! #${postTags[0]} is so close. Lets organize a #${postTags[1]}`,
      });

      const processedModel = await helpers.Tags.getPostWhenTagsAreProcessed(postId);

      await helpers.Tags.checkRelatedPostModels(postTags, processedModel);
    });

    it('Three posts are created. Without orgs. Some tags are duplicated', async () => {
      // lets create some posts with tags

      const tagsSet = [
        'summer', 'party', 'openair', 'eos', 'ether',
      ];

      const postOneTags = [
        tagsSet[0],
        tagsSet[1],
      ];

      const postTwoTags = [
        tagsSet[0], // existing tag, not unique
        tagsSet[2], // new tag
        tagsSet[1], // existing tag, not unique
      ];

      const janePostOneTags = [
        tagsSet[2], // existing tag, not unique
        tagsSet[3], // new tag
        tagsSet[4], // new tag
      ];

      const vladPostOneId = await gen.Posts.createMediaPostByUserHimself(userVlad, {
        description: `Hi everyone! #${postOneTags[0]} #${postOneTags[0]} is so close.
        Lets organize a #${postOneTags[1]}`,
      });

      const vladPostOneModel = await helpers.Tags.getPostWhenTagsAreProcessed(vladPostOneId);
      const { dbTags:vladPostOneDbTags } =
        await helpers.Tags.checkRelatedPostModels(postOneTags, vladPostOneModel);

      delay(500);

      const vladPostTwoId = await gen.Posts.createMediaPostByUserHimself(userVlad, {
        description: `Hi everyone again! #${postTwoTags[0]} is so close.
        Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
      });

      const vladPostTwoModel = await helpers.Tags.getPostWhenTagsAreProcessed(vladPostTwoId);
      const { dbTags: vladPostTwoDbTags } =
        await helpers.Tags.checkRelatedPostModels(
          _.uniq(postOneTags.concat(postTwoTags)),
          vladPostTwoModel,
      );

      expect(vladPostOneDbTags.length + 1).toBe(vladPostTwoDbTags.length);

      expect(vladPostOneDbTags.find((item: any) => item.title === tagsSet[0]))
        .toEqual(vladPostTwoDbTags.find((item: any) => item.title === tagsSet[0]))
      ;

      expect(vladPostOneDbTags.find((item: any) => item.title === tagsSet[1]))
        .toEqual(vladPostTwoDbTags.find((item: any) => item.title === tagsSet[1]))
      ;

      delay(500);

      const janePostOneId = await gen.Posts.createMediaPostByUserHimself(userJane, {
        description: `Hi everyone! #${janePostOneTags[0]} is so close.
        Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
      });

      const janePostOneModel = await helpers.Tags.getPostWhenTagsAreProcessed(janePostOneId);
      const { dbTags: janePostOneDbTags } = await helpers.Tags.checkRelatedPostModels(
        janePostOneTags,
        janePostOneModel,
      );

      expect(vladPostTwoDbTags.find((item: any) => item.title === tagsSet[2]))
        .toEqual(janePostOneDbTags.find((item: any) => item.title === tagsSet[2]))
      ;
    });

    it('one post with new tags is created', async () => {
      const user = userVlad;

      const expectedTags = [
        'hello',
        'amazing',
      ];

      const values = {
        description: `#${expectedTags[0]} there! I am #${expectedTags[1]}`,
      };

      const modelId = await gen.Posts.createMediaPostByUserHimself(user, values);
      const processedModel = await helpers.Tags.getPostWhenTagsAreProcessed(modelId);

      await helpers.Tags.checkRelatedPostModels(expectedTags, processedModel);

    }, 10000);

    it.skip('Create entity_tags with filled org_id if it is appreciable', async () => {

    });

    it.skip('If no tags - do nothing', async () => {
    });

    it.skip('Process only one tag', async () => {
    });
    it.skip('If no new tags - create nothing new in tags model', async () => {
    });

    it.skip('should produce no tags records if there are no ones for new post', async () => {

    });
  });
});
