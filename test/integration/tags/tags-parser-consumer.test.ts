export {};

const _     = require('lodash');
const delay = require('delay');

const helpers = require('../helpers');
const gen     = require('../../generators');

const mockHelper = require('../helpers/mock-helper');
const seedsHelper = require('../helpers/seeds-helper');

const tagsGenerator   = require('../../generators/entity/entity-tags-generator');
const postsGenerator  = require('../../generators/posts-generator');
const orgGenerator    = require('../../generators/organizations-generator');

const tagsHelper = require('../helpers/tags-helper');
const postsHelper = require('../helpers/posts-helper');

let userVlad;
let userJane;

describe('Tags parsing by consumer', () => {
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

  describe('Creating - tags for new posts', () => {
    describe('direct posts', () => {
      it('should create tags for direct post of user himself', async () => {

        const expectedTags = [
          'summer',
          'party',
        ];

        const user = userVlad;
        const targetUser = userJane;

        const newPostFields = {
          description: `Our super #${expectedTags[0]} post #${expectedTags[1]} description`,
        };

        // noinspection JSDeprecatedSymbols
        const directPost = await postsHelper.requestToCreateDirectPostForUser(
          user,
          targetUser,
          newPostFields.description,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(directPost.id, expectedTags);
      });

      it('should create tags for direct post of org', async () => {
        const user = userVlad;

        const expectedTags = [
          'summer',
          'party',
        ];

        const orgId = await orgGenerator.createOrgWithoutTeam(user);

        const newPostFields = {
          description: `Our super #${expectedTags[0]} post #${expectedTags[1]} description`,
        };

        // noinspection JSDeprecatedSymbols//////////////
        const directPost = await helpers.Posts.requestToCreateDirectPostForOrganization(
          user,
          orgId,
          newPostFields.description,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(directPost.id, expectedTags);
      });
    });

    it('Should create org post and have an appropriate org_id in entity_tags', async () => {
      const orgId = await gen.Org.createOrgWithoutTeam(userVlad);

      const postTags = [
        'summer',
        'undefined',
      ];

      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId, {
        description: `Hi everyone! #${postTags[0]} is so close. Lets organize a #${postTags[1]}`,
      });

      const processedModel = await tagsHelper.getPostWhenTagsAreProcessed(postId);

      await tagsHelper.checkRelatedPostModels(postTags, processedModel);
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
  });

  describe('Updating - change tags of existing posts', () => {
    let existingTitles: string[];
    let existingVladPostId;
    let existingPosts;

    beforeEach(async () => {
      // lets create some disturbance
      ({ posts: existingPosts, tagsTitles:existingTitles } =
        await tagsGenerator.createPostsWithTags(userVlad, userJane));
      existingVladPostId = existingPosts.vlad[0];
    });

    describe('Direct posts', () => {
      it('Update direct post of user himself', async () => {
        const initialTags = [
          'summer',
          'party',
        ];

        const postBefore = await tagsGenerator.createDirectPostForUserWithTags(
          userVlad,
          userJane,
          initialTags[0],
          initialTags[1],
        );

        const expectedTags = [
          'predator',
          initialTags[0],
        ];

        await postsHelper.requestToUpdatePostDescription(
          postBefore.id,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(postBefore.id, expectedTags);
      });

      it('Update direct post for org', async () => {
        const user = userVlad;

        const initialTags = [
          'summer',
          'party',
        ];

        const orgId = await orgGenerator.createOrgWithoutTeam(user);

        const newPostFields = {
          description: `Our super #${initialTags[0]} post #${initialTags[1]} description`,
        };

        // noinspection JSDeprecatedSymbols//////////////
        const postBefore = await helpers.Posts.requestToCreateDirectPostForOrganization(
          user,
          orgId,
          newPostFields.description,
        );

        const expectedTags = [
          'predator',
          initialTags[0],
        ];

        await postsHelper.requestToUpdatePostDescription(
          postBefore.id,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(postBefore.id, expectedTags);
      });
    });

    describe('post without any tags', () => {
      let postId;

      beforeEach(async () => {
        postId = await postsGenerator.createMediaPostByUserHimself(userVlad);
      });

      it('should add two new tags for post without any tags', async () => {
        const expectedTags = [
          `${existingTitles[0]}animal`,
          `${existingTitles[1]}predator`,
        ];

        await postsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);

        await tagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      });

      it('should add two existing tags for post without any tags', async () => {
        const expectedTags = [
          existingTitles[1],
          existingTitles[3],
        ];

        await postsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);
        await tagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      });

      it('should add one new tag and one existing tag for post without any tags', async () => {
        const expectedTags = [
          existingTitles[1],
          `${existingTitles[0]}animal`,
        ];

        await postsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);
        await tagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      });
    });

    describe('tags removing', () => {
      it('should remove all tags from post if no tags in description', async () => {
        const expectedTags = [];

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should remove one tag from post and remain the other', async () => {

        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const expectedTags = [
          currentPost.entity_tags[1],
        ];

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });
    });

    describe('update current tag set', () => {
      it('should remove all old tags and add NEW ones - special description', async () => {

        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);
        const expectedTags = currentPost.entity_tags.map((title) => {
          return `${title}predator`;
        });

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should update one of the tags by already existing one', async () => {
        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);
        const expectedTags = [
          currentPost.entity_tags[0],
          existingCandidates[0],
        ];

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add two more NEW tags', async () => {
        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const tagsToAdd = currentPost.entity_tags.map((title) => {
          return `${title}predator`;
        });

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add two more EXISTING tags', async () => {
        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);

        const tagsToAdd = [
          existingCandidates[0],
          existingCandidates[1],
        ];

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add one NEW tag and one EXISTING tag', async () => {
        const currentPost = await postsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);

        const tagsToAdd = [
          existingCandidates[0],
          `${currentPost.entity_tags[0]}predator`,
        ];

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await postsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await tagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should update one of the tags by new one', async () => {
        const { posts } = await tagsGenerator.createPostsWithTags(userVlad, userJane);

        const vladPosts: number[] = posts.vlad;

        const post: any = await helpers.Posts.requestToGetOnePostAsGuest(vladPosts[0]);

        const expectedTags = [
          post.entity_tags[0],
          'winter',
        ];

        const newDescription: string =
          `#${expectedTags[0]}  is remained but lets introduce new tag #${expectedTags[1]}`;

        await helpers.Posts.requestToUpdatePostDescription(vladPosts[0], userVlad, newDescription);

        const postAfter: any =
          await tagsHelper.getPostWhenTagsAreUpdated(vladPosts[0], expectedTags);

        await tagsHelper.checkRelatedPostModels(expectedTags, postAfter);
      });

      it('If no new tags - create nothing new in tags model', async () => {
        const postId = existingVladPostId;

        const post: any = await helpers.Posts.requestToGetOnePostAsGuest(postId);

        const entityTagsBefore = await tagsHelper.getRelatedPostEntityTags(postId);

        const expectedTags = [
          post.entity_tags[0],
          post.entity_tags[1],
        ];

        await postsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);

        const postAfter: any =
          await tagsHelper.getPostWhenTagsAreUpdated(postId, expectedTags);

        await tagsHelper.checkRelatedPostModels(expectedTags, postAfter);

        const entityTagsAfter = await tagsHelper.getRelatedPostEntityTags(postId);

        expect(entityTagsAfter).toEqual(entityTagsBefore);
      });
    });
  });
});
