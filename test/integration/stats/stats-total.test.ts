/* eslint-disable guard-for-in */
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import StatsHelper = require('../helpers/stats-helper');

import StatsRequestHelper = require('../helpers/stats-request-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import PostsHelper = require('../helpers/posts-helper');
import CommentsHelper = require('../helpers/comments-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import EntityTotalsCalculator = require('../../../lib/stats/service/entity-totals-calculator');
import TotalDeltaCalculationService = require('../../../lib/stats/service/total-delta-calculation-service');

const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;


const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

const JEST_TIMEOUT = 5000;

const RECALC_INTERVAL = 'PT1H';

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

describe('Stats totals', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Get stats', () => {
    it('Smoke - Check stats url', async () => {
      await EntityEventParamGeneratorV2.createAllTotalEvents();
      await EntityTotalsCalculator.calculate();
      await TotalDeltaCalculationService.updateTotalDeltas();

      await StatsRequestHelper.getStatsTotal();
    });
  });

  describe('Stats for users', () => {
    it('Current number of users', async () => {
      const eventType = ParamTypes.USERS_PERSON__NUMBER;
      const number = 4;
      const description = 'USERS_PERSON__NUMBER';

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Stats for organizations', () => {
    it('Current number of organizations', async () => {
      const number = 8;
      await OrganizationsGenerator.createManyOrgWithoutTeam(userVlad, number);

      const eventType = ParamTypes.ORGS_PERSON__NUMBER;
      const description = 'ORGS_PERSON__NUMBER';

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Stats for posts', () => {
    it('Current number of media posts', async () => {
      const number = 12;
      const eventType = ParamTypes.POSTS_MEDIA__NUMBER;
      const description = 'POSTS_MEDIA__NUMBER';

      await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, number);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);

    it('Current number of direct posts', async () => {
      const number = 14;
      const eventType = ParamTypes.POSTS_DIRECT__NUMBER;
      const description = 'POSTS_DIRECT__NUMBER';

      await PostsGenerator.createManyDirectPostsForUserAndGetIds(userVlad, userJane, number);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Stats for tags', () => {
    it('Current number of tags', async () => {
      const number = 11;
      await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, number);

      const eventType = ParamTypes.TAGS_PERSON__NUMBER;
      const description = 'TAGS_PERSON__NUMBER';

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Stats for comments', () => {
    it('Current number of comments on posts', async () => {
      const number = 18;
      const eventType = ParamTypes.COMMENTS_PARENT__NUMBER;
      const description = 'COMMENTS_PARENT__NUMBER';

      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const comments = await CommentsGenerator.createManyCommentsForPost(postId, userJane, number);

      // disturbance
      await Promise.all([
        CommentsGenerator.createCommentOnComment(postId, comments[0].id, userPetr),
        CommentsGenerator.createCommentOnComment(postId, comments[1].id, userRokky),
      ]);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);

    it('Current number of replies', async () => {
      const number = 3;
      const eventType = ParamTypes.COMMENTS_REPLY__NUMBER;
      const description = 'COMMENTS_REPLY__NUMBER';

      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const parentComment = await CommentsGenerator.createCommentForPost(postId, userJane);

      const firstReply = await CommentsGenerator.createCommentOnComment(postId, parentComment.id, userJane);
      const secondReply = await CommentsGenerator.createCommentOnComment(postId, firstReply.id, userPetr);
      await CommentsGenerator.createCommentOnComment(postId, secondReply.id, userVlad);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Stats for votes', () => {
    it('Current number of upvotes', async () => {
      const number = 4;

      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      await PostsHelper.requestToUpvotePost(userJane, postId);

      const directPostId = await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);
      await PostsHelper.requestToUpvotePost(userJane, directPostId);

      const comment = await CommentsGenerator.createCommentForPost(postId, userPetr);
      await CommentsHelper.requestToUpvoteComment(postId, comment.id, userRokky);

      const commentReply = await CommentsGenerator.createCommentOnComment(postId, comment.id, userVlad);
      await CommentsHelper.requestToUpvoteComment(postId, commentReply.id, userJane);

      const eventType = ParamTypes.ACTIVITIES_VOTE_UPVOTE__NUMBER;
      const description = 'ACTIVITIES_VOTE_UPVOTE__NUMBER';

      // disturbance
      await PostsHelper.requestToDownvotePost(userPetr, directPostId);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);

    it('Current number of downvotes', async () => {
      // tested upvotes + 1 - in order not to mix upvotes and downvotes by mistake
      const number = 5;

      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      await PostsHelper.requestToDownvotePost(userJane, postId);

      const directPostId = await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);
      await PostsHelper.requestToDownvotePost(userJane, directPostId);

      const comment = await CommentsGenerator.createCommentForPost(postId, userPetr);
      await CommentsHelper.requestToDownvoteComment(postId, comment.id, userRokky);

      const commentReply = await CommentsGenerator.createCommentOnComment(postId, comment.id, userVlad);
      await CommentsHelper.requestToDownvoteComment(postId, commentReply.id, userJane);

      const eventType = ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER;
      const description = 'ACTIVITIES_VOTE_DOWNVOTE__NUMBER';

      // in order not to mix upvotes and downvotes by mistake
      await PostsHelper.requestToDownvotePost(userPetr, directPostId);

      // disturbance
      await PostsHelper.requestToUpvotePost(userRokky, directPostId);

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });

  describe('Reposts', () => {
    it('Current number of reposts of media posts', async () => {
      const number = 3;

      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      await Promise.all([
        await PostsGenerator.createRepostOfUserPost(userJane, postId),
        await PostsGenerator.createRepostOfUserPost(userPetr, postId),
        await PostsGenerator.createRepostOfUserPost(userRokky, postId),
      ]);

      // disturbance
      await PostsGenerator.createUserDirectPostAndRepost(userJane, userVlad, userRokky);

      const eventType = ParamTypes.POSTS_REPOST_MEDIA__NUMBER;
      const description = 'POSTS_REPOST_MEDIA__NUMBER';

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);

    it('Current number of reposts of direct posts', async () => {
      const number = 2;

      const postId = await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);

      await Promise.all([
        await PostsGenerator.createRepostOfUserPost(userJane, postId),
        await PostsGenerator.createRepostOfUserPost(userPetr, postId),
      ]);

      // disturbance
      await PostsGenerator.createUserPostAndRepost(userJane, userVlad);

      const eventType = ParamTypes.POSTS_REPOST_DIRECT__NUMBER;
      const description = 'POSTS_REPOST_DIRECT__NUMBER';

      await StatsHelper.checkStatsTotalForOneTypeDynamically(eventType, number, description, RECALC_INTERVAL);
    }, JEST_TIMEOUT);
  });
});

export {};
