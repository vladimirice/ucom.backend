import PostsHelper = require('../helpers/posts-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import TagsHelper = require('../helpers/tags-helper');
import NotificationsHelper = require('../helpers/notifications-helper');
import CommonHelper = require('../helpers/common-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import EntityEntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');

const _     = require('lodash');
const delay = require('delay');

let userVlad;
let userJane;
let userPetr;

const JEST_TIMEOUT = 10000;

const beforeOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

describe('Tags parsing by consumer', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Creating - both tags and mentions', () => {
    it('[Smoke] create both tags and mentions for post', async () => {
      const expectedTags = [
        'summer',
        'party',
      ];

      const user = userVlad; //
      const targetUser = userJane;

      const newPostFields = {
        description: `Our super #${expectedTags[0]}
        post #${expectedTags[1]} @${userPetr.account_name} description`,
      };

      const directPost = await PostsGenerator.createUserDirectPostForOtherUser(
        user,
        targetUser,
        newPostFields.description,
      );

      await TagsHelper.checkRelatedPostModelsByPostId(directPost.id, expectedTags);

      const mentionNotification =
        await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

      const options = {
        postProcessing: 'notification',
      };

      CommonHelper.checkUserMentionsYouInsidePost(
        mentionNotification[0],
        options,
        directPost.id,
        userVlad.id,
        userPetr.id,
      );
    }, JEST_TIMEOUT);
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

        const directPost = await PostsGenerator.createUserDirectPostForOtherUser(
          user,
          targetUser,
          newPostFields.description,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(directPost.id, expectedTags);
      }, JEST_TIMEOUT);

      it('should create tags for direct post of org', async () => {
        const user = userVlad;

        const expectedTags = [
          'summer',
          'party',
        ];

        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(user);

        const newPostFields = {
          description: `Our super #${expectedTags[0]} post #${expectedTags[1]} description`,
        };

        const directPost = await PostsGenerator.createDirectPostForOrganization(
          user,
          orgId,
          newPostFields.description,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(directPost.id, expectedTags);
      }, JEST_TIMEOUT);
    });

    it('Should create org post and have an appropriate org_id in entity_tags', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const postTags = [
        'summer',
        'undefined',
      ];

      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId, {
        description: `Hi everyone! #${postTags[0]} is so close. Lets organize a #${postTags[1]}`,
      });

      const processedModel = await TagsHelper.getPostWhenTagsAreProcessed(postId);

      await TagsHelper.checkRelatedPostModels(postTags, processedModel);
    }, JEST_TIMEOUT);

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

      const vladPostOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
        description: `Hi everyone! #${postOneTags[0]} #${postOneTags[0]} is so close.
        Lets organize a #${postOneTags[1]}`,
      });

      const vladPostOneModel = await TagsHelper.getPostWhenTagsAreProcessed(vladPostOneId);
      // @ts-ignore
      const { dbTags:vladPostOneDbTags } =
        await TagsHelper.checkRelatedPostModels(postOneTags, vladPostOneModel);

      await delay(500);

      const vladPostTwoId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
        description: `Hi everyone again! #${postTwoTags[0]} is so close.
        Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
      });

      const vladPostTwoModel = await TagsHelper.getPostWhenTagsAreProcessed(vladPostTwoId);
      // @ts-ignore
      const { dbTags: vladPostTwoDbTags } =
        await TagsHelper.checkRelatedPostModels(
          [...new Set(postOneTags.concat(postTwoTags))],
          vladPostTwoModel,
        );

      expect(vladPostOneDbTags.length + 1).toBe(vladPostTwoDbTags.length);

      expect(vladPostOneDbTags.find((item: any) => item.title === tagsSet[0]))
        .toEqual(vladPostTwoDbTags.find((item: any) => item.title === tagsSet[0]))
      ;

      expect(vladPostOneDbTags.find((item: any) => item.title === tagsSet[1]))
        .toEqual(vladPostTwoDbTags.find((item: any) => item.title === tagsSet[1]))
      ;

      await delay(500);

      const janePostOneId = await PostsGenerator.createMediaPostByUserHimself(userJane, {
        description: `Hi everyone! #${janePostOneTags[0]} is so close.
        Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
      });

      const janePostOneModel = await TagsHelper.getPostWhenTagsAreProcessed(janePostOneId);
      // @ts-ignore
      const { dbTags: janePostOneDbTags } = await TagsHelper.checkRelatedPostModels(
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

      const modelId = await PostsGenerator.createMediaPostByUserHimself(user, values);
      const processedModel = await TagsHelper.getPostWhenTagsAreProcessed(modelId);

      await TagsHelper.checkRelatedPostModels(expectedTags, processedModel);
    }, JEST_TIMEOUT);
  });

  describe('Updating - change tags of existing posts', () => {
    let existingTitles: string[];
    let existingVladPostId;
    let existingPosts;

    beforeEach(async () => {
      // lets create some disturbance
      ({ posts: existingPosts, tagsTitles:existingTitles } =
        await EntityEntityTagsGenerator.createPostsWithTags(userVlad, userJane));
      // eslint-disable-next-line prefer-destructuring
      existingVladPostId = existingPosts.vlad[0];
    });

    describe('Direct posts', () => {
      it('Update direct post of user himself', async () => {
        const initialTags = [
          'summer',
          'party',
        ];

        const postBefore = await EntityTagsGenerator.createDirectPostForUserWithTags(
          userVlad,
          userJane,
          initialTags[0],
          initialTags[1],
        );

        const expectedTags = [
          'predator',
          initialTags[0],
        ];

        await PostsHelper.requestToUpdatePostDescription(
          postBefore.id,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(postBefore.id, expectedTags);
      });

      it('Update direct post for org', async () => {
        const user = userVlad;

        const initialTags = [
          'summer',
          'party',
        ];

        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(user);

        const newPostFields = {
          description: `Our super #${initialTags[0]} post #${initialTags[1]} description`,
        };

        const postBefore = await PostsGenerator.createDirectPostForOrganization(
          user,
          orgId,
          newPostFields.description,
        );

        const expectedTags = [
          'predator',
          initialTags[0],
        ];

        await PostsHelper.requestToUpdatePostDescription(
          postBefore.id,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(postBefore.id, expectedTags);
      });
    });

    describe('post without any tags', () => {
      let postId;

      beforeEach(async () => {
        postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      });

      it('should add two new tags for post without any tags', async () => {
        const expectedTags = [
          `${existingTitles[0]}animal`,
          `${existingTitles[1]}predator`,
        ];

        await PostsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);

        await TagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      });

      it('should add two existing tags for post without any tags', async () => {
        const expectedTags = [
          existingTitles[1],
          existingTitles[3],
        ];

        await PostsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);
        await TagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      }, JEST_TIMEOUT);

      it('should add one new tag and one existing tag for post without any tags', async () => {
        const expectedTags = [
          existingTitles[1],
          `${existingTitles[0]}animal`,
        ];

        await PostsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);
        await TagsHelper.checkRelatedPostModelsByPostId(postId, expectedTags);
      });
    });

    describe('tags removing', () => {
      it('should remove all tags from post if no tags in description', async () => {
        const expectedTags = [];

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should remove one tag from post and remain the other', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const expectedTags: string[] = [
          currentPost.entity_tags[1],
        ];

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });
    });

    describe('update current tag set', () => {
      it('should remove all old tags and add NEW ones - special description', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);
        const expectedTags = currentPost.entity_tags.map(title => `${title}predator`);

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should update one of the tags by already existing one', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);
        const expectedTags = [
          currentPost.entity_tags[0],
          existingCandidates[0],
        ];

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add two more NEW tags', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const tagsToAdd = currentPost.entity_tags.map(title => `${title}predator`);

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add two more EXISTING tags', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);

        const tagsToAdd = [
          existingCandidates[0],
          existingCandidates[1],
        ];

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should add one NEW tag and one EXISTING tag', async () => {
        const currentPost = await PostsHelper.requestToGetOnePostAsGuest(existingVladPostId);

        const existingCandidates = _.difference(existingTitles, currentPost.entity_tags);

        const tagsToAdd = [
          existingCandidates[0],
          `${currentPost.entity_tags[0]}predator`,
        ];

        const expectedTags = currentPost.entity_tags.concat(tagsToAdd);

        await PostsHelper.requestToUpdatePostDescription(
          existingVladPostId,
          userVlad,
          null,
          expectedTags,
        );

        await TagsHelper.checkRelatedPostModelsByPostId(existingVladPostId, expectedTags);
      });

      it('should update one of the tags by new one', async () => {
        const { posts } = await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);

        const vladPosts: number[] = posts.vlad;

        const post: any = await PostsHelper.requestToGetOnePostAsGuest(vladPosts[0]);

        const expectedTags = [
          post.entity_tags[0],
          'winter',
        ];

        const newDescription: string =
          `#${expectedTags[0]}  is remained but lets introduce new tag #${expectedTags[1]}`;

        await PostsHelper.requestToUpdatePostDescription(vladPosts[0], userVlad, newDescription);

        const postAfter: any =
          await TagsHelper.getPostWhenTagsAreUpdated(vladPosts[0], expectedTags);

        await TagsHelper.checkRelatedPostModels(expectedTags, postAfter);
      }, JEST_TIMEOUT);

      it('If no new tags - create nothing new in tags model', async () => {
        const postId = existingVladPostId;

        const post: any = await PostsHelper.requestToGetOnePostAsGuest(postId);

        const entityTagsBefore = await TagsHelper.getRelatedPostEntityTags(postId);

        const expectedTags = [
          post.entity_tags[0],
          post.entity_tags[1],
        ];

        await PostsHelper.requestToUpdatePostDescription(postId, userVlad, null, expectedTags);

        const postAfter: any =
          await TagsHelper.getPostWhenTagsAreUpdated(postId, expectedTags);

        await TagsHelper.checkRelatedPostModels(expectedTags, postAfter);

        const entityTagsAfter = await TagsHelper.getRelatedPostEntityTags(postId);

        expect(entityTagsAfter).toEqual(entityTagsBefore);
      });
    });
  });
});

export {};
