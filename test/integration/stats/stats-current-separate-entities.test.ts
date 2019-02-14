import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');
import PostsGenerator = require('../../generators/posts-generator');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import _ = require('lodash');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');
import StatsHelper = require('../helpers/stats-helper');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

const  JEST_TIMEOUT = 10000;

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('for tags', () => {
    it('check post types amounts for tags', async () => {
      const batchSize = 2;

      const tagOneTitle   = 'summer';
      const tagTwoTitle   = 'autumn';
      const tagThreeTitle = 'winter';

      await Promise.all([
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
        EntityTagsGenerator.createTagViaNewDirectPost(userVlad, userJane, tagOneTitle),

        EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle),

        EntityTagsGenerator.createTagViaNewDirectPost(userJane, userVlad, tagThreeTitle),
      ]);

      await TagsCurrentRateProcessor.process();

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithTagEntityName(
          EventParamTypeDictionary.getTagItselfCurrentAmounts(),
        );

      expect(_.isEmpty(events)).toBeFalsy();

      expect(events.length).toBe(3);

      const [tagOneModel, tagTwoModel, tagThreeModel] = await Promise.all([
        TagsRepository.findOneByTitle(tagOneTitle),
        TagsRepository.findOneByTitle(tagTwoTitle),
        TagsRepository.findOneByTitle(tagThreeTitle),
      ]);

      const expectedSet = {
        [tagOneModel!.id]: {
          current_media_posts_amount: 2,
          current_direct_posts_amount: 1,
          current_posts_amount: 3,
          current_followers_amount: 0,
          importance: 0,
        },
        [tagTwoModel!.id]: {
          current_media_posts_amount: 1,
          current_direct_posts_amount: 0,
          current_posts_amount: 1,
          current_followers_amount: 0,
          importance: 0,
        },
        [tagThreeModel!.id]: {
          current_media_posts_amount: 0,
          current_direct_posts_amount: 1,
          current_posts_amount: 1,
          current_followers_amount: 0,
          importance: 0,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);
    });
  });

  describe('for organizations', () => {
    it('calculate organization followers amount', async () => {
      const batchSize = 2;
      const [orgOneId, orgTwoId, orgThreeId, orgFourId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
        OrganizationsGenerator.createOrgWithoutTeam(userPetr),
        OrganizationsGenerator.createOrgWithoutTeam(userRokky),
      ]);

      await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgOneId);
      await OrganizationsHelper.requestToFollowOrganization(orgOneId, userPetr);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgOneId);

      await OrganizationsHelper.requestToFollowOrganization(orgTwoId, userPetr);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userVlad, orgTwoId);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgTwoId);

      await OrganizationsHelper.requestToFollowOrganization(orgThreeId, userRokky);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(
          EventParamTypeDictionary.getOrgFollowersCurrentAmount(),
        );

      expect(_.isEmpty(events)).toBeFalsy();

      expect(events.length).toBe(3);

      const orgOneEvent    = events.find(item => +item.entity_id === orgOneId)!;
      const orgTwoEvent    = events.find(item => +item.entity_id === orgTwoId)!;
      const orgThreeEvent    = events.find(item => +item.entity_id === orgThreeId)!;
      expect(events.some(item => +item.entity_id === orgFourId)).toBeFalsy();

      expect(orgOneEvent.json_value.data).toEqual({ followers: 2 });
      expect(+orgOneEvent.result_value).toBe(2);

      expect(orgTwoEvent.json_value.data).toEqual({ followers: 1 });
      expect(+orgTwoEvent.result_value).toBe(1);

      expect(orgThreeEvent.json_value.data).toEqual({ followers: 1 });
      expect(+orgThreeEvent.result_value).toBe(1);
    });

    it('calculate organization-related posts', async () => {
      const batchSize = 2;
      const [orgOneId, orgTwoId, orgThreeId, orgFourId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
        OrganizationsGenerator.createOrgWithoutTeam(userRokky),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
      ]);

      await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, orgOneId, 3),
        PostsGenerator.createDirectPostForOrganization(userJane, orgOneId),
        PostsGenerator.createDirectPostForOrganization(userPetr, orgOneId),

        PostsGenerator.createDirectPostForOrganization(userPetr, orgTwoId),
        PostsGenerator.createMediaPostOfOrganization(userRokky, orgThreeId),
      ]);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(
          EventParamTypeDictionary.getOrgPostsCurrentAmount(),
        );

      expect(_.isEmpty(postEvents)).toBeFalsy();

      expect(postEvents.length).toBe(3);

      const postOneEvent    = postEvents.find(item => +item.entity_id === orgOneId)!;
      const postTwoEvent    = postEvents.find(item => +item.entity_id === orgTwoId)!;
      const postThreeEvent  = postEvents.find(item => +item.entity_id === orgThreeId)!;
      expect(postEvents.some(item => +item.entity_id === orgFourId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({
        media_posts: 3,
        direct_posts: 2,
        total: 5,
      });
      expect(+postOneEvent.result_value).toBe(5);

      expect(postTwoEvent.json_value.data).toEqual({
        media_posts: 0,
        direct_posts: 1,
        total: 1,
      });
      expect(+postTwoEvent.result_value).toBe(1);

      expect(postThreeEvent.json_value.data).toEqual({
        media_posts: 1,
        direct_posts: 0,
        total: 1,
      });
      expect(+postThreeEvent.result_value).toBe(1);
    });
  });

  describe('for post of user himself', () => {
    it('calculate post comments current amount', async () => {
      // First post has four comments - two direct and two comment on comment
      const postOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const batchSize = 2;

      const [postOneCommentOneId] = await Promise.all([
        CommentsGenerator.createCommentForPostAndGetId(postOneId, userVlad),
        CommentsGenerator.createCommentForPostAndGetId(postOneId, userJane),
      ]);

      await Promise.all([
        CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userPetr),
        CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userRokky),
      ]);

      // Second post has only one comment - direct one
      const postTwoId = await PostsGenerator.createMediaPostByUserHimself(userJane);
      await CommentsGenerator.createCommentForPost(postTwoId, userPetr);

      // Third post has no comments.
      const postThreeId = await PostsGenerator.createMediaPostByUserHimself(userRokky);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostCommentsCurrentAmount(),
        );

      expect(_.isEmpty(postEvents)).toBeFalsy();

      expect(postEvents.length).toBe(2);

      const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
      const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
      expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({ comments: 4 });
      expect(+postOneEvent.result_value).toBe(4);
      expect(postTwoEvent.json_value.data).toEqual({ comments: 1 });
      expect(+postTwoEvent.result_value).toBe(1);
    });
    it('calculate current post reposts amount to entity-event-params', async () => {
      const batchSize = 2;

      const postOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      // Post one has two reposts
      await Promise.all([
        PostsGenerator.createRepostOfUserPost(userJane, postOneId),
        PostsGenerator.createRepostOfUserPost(userPetr, postOneId),
      ]);

      // Post two has one repost only
      const { postId: postTwoId } =
        await PostsGenerator.createUserPostAndRepost(userVlad, userJane);

      // Post three does not have any reposts
      const postThreeId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostRepostsCurrentAmount(),
        );

      expect(_.isEmpty(postEvents)).toBeFalsy();

      expect(postEvents.length).toBe(2);

      const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
      const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
      expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({
        reposts: 2,
      });
      expect(postTwoEvent.json_value.data).toEqual({
        reposts: 1,
      });
    });
    it('calculate upvotes/downvotes amount for posts', async () => {
      const batchSize = 2;
      const entitiesAmount = 4;
      // @ts-ignore
      const [postOneId, postTwoId, postThreeId, postFourId] =
        await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, entitiesAmount);

      await Promise.all([
        // Three likes for first post
        PostsHelper.requestToUpvotePost(userJane, postOneId),
        PostsHelper.requestToUpvotePost(userPetr, postOneId),
        PostsHelper.requestToUpvotePost(userRokky, postOneId),
      ]);
      await Promise.all([
        // Two likes and one dislike for second post
        PostsHelper.requestToUpvotePost(userJane, postTwoId),
        PostsHelper.requestToUpvotePost(userPetr, postTwoId),
        PostsHelper.requestToDownvotePost(userRokky, postTwoId),
      ]);

      await Promise.all([
        // Three dislikes, no likes for third post
        PostsHelper.requestToDownvotePost(userJane, postThreeId),
        PostsHelper.requestToDownvotePost(userPetr, postThreeId),
        PostsHelper.requestToDownvotePost(userRokky, postThreeId),
      ]);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostVotesCurrentAmount(),
        );

      const expectedSet = {
        [postOneId]: {
          upvotes: 3,
          downvotes: 0,
          total: 3,
        },
        [postTwoId]: {
          upvotes: 2,
          downvotes: 1,
          total: 1,
        },
        [postThreeId]: {
          upvotes: 0,
          downvotes: 3,
          total: -3,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(postEvents, expectedSet);
    }, JEST_TIMEOUT);
  });

  describe('for post of organization', () => {
    let vladOrgId: number;
    let janeOrgId: number;
    let rokkyOrgId: number;
    beforeEach(async () => {
      [vladOrgId, janeOrgId, rokkyOrgId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
        OrganizationsGenerator.createOrgWithoutTeam(userRokky),
      ]);
    });

    it('calculate org post comments current amount', async () => {
      // First post has four comments - two direct and two comment on comment
      const postOneId = await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);
      const batchSize = 2;

      const [postOneCommentOneId] = await Promise.all([
        CommentsGenerator.createCommentForPostAndGetId(postOneId, userVlad),
        CommentsGenerator.createCommentForPostAndGetId(postOneId, userJane),
      ]);

      await Promise.all([
        CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userPetr),
        CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userRokky),
      ]);

      // Second post has only one comment - direct one
      const postTwoId = await PostsGenerator.createMediaPostOfOrganization(userJane, janeOrgId);
      await CommentsGenerator.createCommentForPost(postTwoId, userPetr);

      // Third post has no comments.
      const postThreeId = await PostsGenerator.createMediaPostOfOrganization(userRokky, rokkyOrgId);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostCommentsCurrentAmount(),
        );

      expect(_.isEmpty(postEvents)).toBeFalsy();

      expect(postEvents.length).toBe(2);

      const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
      const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
      expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({ comments: 4 });
      expect(+postOneEvent.result_value).toBe(4);
      expect(postTwoEvent.json_value.data).toEqual({ comments: 1 });
      expect(+postTwoEvent.result_value).toBe(1);
    });
    it('calculate current org post reposts amount to entity-event-params', async () => {
      const batchSize = 2;

      const postOneId = await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);

      // Post one has two reposts
      await Promise.all([
        PostsGenerator.createRepostOfUserPost(userJane, postOneId),
        PostsGenerator.createRepostOfUserPost(userPetr, postOneId),
      ]);

      // Post two has one repost only
      const postTwoId = await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);
      await PostsGenerator.createRepostOfUserPost(userJane, postTwoId);

      // Post three does not have any reposts
      const postThreeId = await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostRepostsCurrentAmount(),
        );

      expect(_.isEmpty(postEvents)).toBeFalsy();

      expect(postEvents.length).toBe(2);

      const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
      const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
      expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({
        reposts: 2,
      });
      expect(postTwoEvent.json_value.data).toEqual({
        reposts: 1,
      });
    });
    it('calculate upvotes/downvotes amount for org posts', async () => {
      const batchSize = 2;
      const entitiesAmount = 4;
      // @ts-ignore
      const [postOneId, postTwoId, postThreeId, postFourId] =
        await PostsGenerator.createManyMediaPostsOfOrganization(
          userVlad,
          vladOrgId,
          entitiesAmount,
        );

      await Promise.all([
        // Three likes for first post
        PostsHelper.requestToUpvotePost(userJane, postOneId),
        PostsHelper.requestToUpvotePost(userPetr, postOneId),
        PostsHelper.requestToUpvotePost(userRokky, postOneId),
      ]);
      await Promise.all([
        // Two likes and one dislike for second post
        PostsHelper.requestToUpvotePost(userJane, postTwoId),
        PostsHelper.requestToUpvotePost(userPetr, postTwoId),
        PostsHelper.requestToDownvotePost(userRokky, postTwoId),
      ]);

      await Promise.all([
        // Three dislikes, no likes for third post
        PostsHelper.requestToDownvotePost(userJane, postThreeId),
        PostsHelper.requestToDownvotePost(userPetr, postThreeId),
        PostsHelper.requestToDownvotePost(userRokky, postThreeId),
      ]);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostVotesCurrentAmount(),
        );

      const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
      const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
      const postThreeEvent = postEvents.find(item => +item.entity_id === postThreeId)!;

      expect(postEvents.some(item => +item.entity_id === postFourId)).toBeFalsy();

      expect(postOneEvent.json_value.data).toEqual({
        upvotes: 3,
        downvotes: 0,
        total: 3,
      });
      expect(postTwoEvent.json_value.data).toEqual({
        upvotes: 2,
        downvotes: 1,
        total: 1,
      });
      expect(postThreeEvent.json_value.data).toEqual({
        upvotes: 0,
        downvotes: 3,
        total: -3,
      });
    }, JEST_TIMEOUT);
  });
});

export {};
