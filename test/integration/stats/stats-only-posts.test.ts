/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { StatsEventsOptions } from '../../interfaces/options-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

import RequestHelper = require('../helpers/request-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import PostsHelper = require('../helpers/posts-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

describe('Stats delta related to posts', () => {
  let sampleDataSet;

  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Post current stats', () => {
    describe('for post of user himself', () => {
      it('calculate post comments current amount', async () => {
        // First post has four comments - two direct and two comment on comment
        const firstPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const batchSize = 2;

        const [postOneCommentOneId] = await Promise.all([
          CommentsGenerator.createCommentForPostAndGetId(firstPostId, userVlad),
          CommentsGenerator.createCommentForPostAndGetId(firstPostId, userJane),
        ]);

        await Promise.all([
          CommentsGenerator.createCommentOnComment(firstPostId, postOneCommentOneId, userPetr),
          CommentsGenerator.createCommentOnComment(firstPostId, postOneCommentOneId, userRokky),
        ]);

        // Second post has only one comment - direct one
        const secondPostId = await PostsGenerator.createMediaPostByUserHimself(userJane);
        await CommentsGenerator.createCommentForPost(secondPostId, userPetr);

        // Third post has no comments.
        await PostsGenerator.createMediaPostByUserHimself(userRokky);

        await EntityJobExecutorService.processEntityEventParam(batchSize);

        const events: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getPostCommentsCurrentAmount(),
          );

        const expectedSet = {
          [firstPostId]: {
            comments: 4,
          },
          [secondPostId]: {
            comments: 1,
          },
        };

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);

        const postOneEvent = events.find(item => +item.entity_id === firstPostId)!;
        const postTwoEvent = events.find(item => +item.entity_id === secondPostId)!;

        expect(+postOneEvent.result_value).toBe(4);
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
        await PostsGenerator.createMediaPostByUserHimself(userVlad);

        await EntityJobExecutorService.processEntityEventParam(batchSize);

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getPostRepostsCurrentAmount(),
          );


        const expectedSet = {
          [postOneId]: {
            reposts: 2,
          },
          [postTwoId]: {
            reposts: 1,
          },
        };

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(postEvents, expectedSet);
      });

      it('calculate upvotes/downvotes amount for posts', async () => {
        const batchSize = 2;
        const entitiesAmount = 4;

        // forthEntity is ignored - it is for autotests disturbance
        const [postOneId, postTwoId, postThreeId] =
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
      });
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
        await PostsGenerator.createMediaPostOfOrganization(userRokky, rokkyOrgId);

        await EntityJobExecutorService.processEntityEventParam(batchSize);

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getPostCommentsCurrentAmount(),
          );

        const expectedSet = {
          [postOneId]: {
            comments: 4,
          },
          [postTwoId]: {
            comments: 1,
          },
        };

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(postEvents, expectedSet);

        const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
        const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;

        expect(+postOneEvent.result_value).toBe(4);
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
        await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);

        await EntityJobExecutorService.processEntityEventParam(batchSize);

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getPostRepostsCurrentAmount(),
          );

        const expectedSet = {
          [postOneId]: {
            reposts: 2,
          },
          [postTwoId]: {
            reposts: 1,
          },
        };

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(postEvents, expectedSet);
      });

      it('calculate upvotes/downvotes amount for org posts', async () => {
        const batchSize = 2;
        const entitiesAmount = 4;

        // Forth post will be without any activity
        const [postOneId, postTwoId, postThreeId] =
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
      });
    });
  });

  describe('Post stats delta', () => {
    describe('posts stats delta - not importance', () => {
      beforeEach(async () => {
        await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
        await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
        sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
      });

      it('posts only workflow - fresh stats table', async () => {
        const fieldNameInitial = 'upvotes';
        const fieldNameRes = 'upvotes_delta';
        const sampleData = sampleDataSet[fieldNameInitial];

        await EntityCalculationService.updateEntitiesDeltas();

        const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostUpvotesDelta(),
      );
        StatsHelper.checkManyEventsStructure(events);

        StatsHelper.checkManyEventsJsonValuesBySampleData(
          events,
          sampleData,
          fieldNameInitial,
          fieldNameRes,
        );
      });

      it('posts stats activity index delta', async () => {
        const fieldNameInitial = 'activity_index';
        const fieldNameRes = 'activity_index_delta';
        const eventType = EventParamTypeDictionary.getPostActivityIndexDelta();
        const sampleData = sampleDataSet[fieldNameInitial];

        await EntityCalculationService.updateEntitiesDeltas();

        const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(eventType);

        StatsHelper.checkManyEventsJsonValuesBySampleData(
          events,
          sampleData,
          fieldNameInitial,
          fieldNameRes,
        );
      });
    });


    describe('Stats importance delta for posts', () => {
      let firstPostId: number;
      let secondPostId: number;
      beforeEach(async () => {
        await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
        await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();

        firstPostId   = RequestHelper.generateRandomNumber(0, 1000, 0);
        secondPostId  = RequestHelper.generateRandomNumber(0, 1000, 0) + 1;

        const options: StatsEventsOptions = {
          posts: {
            importance:     false,
            upvotes:        true,
            activityIndex:  true,
          },
        };

        return EntityEventParamGeneratorV2.createDifferentEventsForPosts(
          firstPostId,
          secondPostId,
          options,
        );
      });

      it('posts only workflow - fresh stats table', async () => {
        const entityName = PostsModelProvider.getEntityName();

        const initialFieldName = 'importance';

        const postsData = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
          firstPostId,
          secondPostId,
          entityName,
          EventParamTypeDictionary.getCurrentBlockchainImportance(),
          initialFieldName,
        );

        await EntityCalculationService.updateEntitiesDeltas();

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
        StatsHelper.checkManyEventsStructure(postEvents);

        postEvents.forEach((event) => {
          event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
        });

        const expectedSet: any = {};
        for (const postId in postsData) {
          expectedSet[postId] = {
            importance_delta: +postsData[postId].importance.delta.toFixed(2),
          };
        }

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(
          postEvents,
          expectedSet,
        );
      });

      it('Check situation - no before records (no rating yet) - entity is newcomer-star', async () => {
        const postsData =
          await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSetForFirstOnlyAfter(
            firstPostId,
            secondPostId,
          );

        await EntityCalculationService.updateEntitiesDeltas();

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
        StatsHelper.checkManyEventsStructure(postEvents);

        postEvents.forEach((event) => {
          event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
        });

        const expectedSet: any = {};
        for (const postId in postsData) {
          expectedSet[postId] = {
            importance_delta: +postsData[postId].importance.delta.toFixed(2),
          };
        }

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(
          postEvents,
          expectedSet,
        );
      });

      // tslint:disable-next-line:max-line-length
      it('Check situation - no after records (rating is disappeared somehow) - make delta zero', async () => {
        const postsData =
          await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSetForSecondOnlyBefore(
            firstPostId,
            secondPostId,
          );

        await EntityCalculationService.updateEntitiesDeltas();

        const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
        StatsHelper.checkManyEventsStructure(postEvents);

        postEvents.forEach((event) => {
          event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
        });

        const expectedSet: any = {};
        for (const postId in postsData) {
          expectedSet[postId] = {
            importance_delta: +postsData[postId].importance.delta.toFixed(2),
          };
        }

        StatsHelper.checkManyEventsJsonValuesByExpectedSet(
          postEvents,
          expectedSet,
        );
      });
    });
  });
});

export {};
