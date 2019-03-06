import SeedsHelper = require('../helpers/seeds-helper');

import StatsHelper = require('../helpers/stats-helper');

import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');

const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;


const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

const JEST_TIMEOUT = 5000;

const RECALC_INTERVAL = 'PT1H';

let sampleDataSet;
describe('Stats totals', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
    sampleDataSet = await EntityEventParamGeneratorV2.createAllTotalEvents();
  });

  describe('Delta Stats for users', () => {
    it('Delta Stats for users', async () => {
      const eventTypeInitial  = ParamTypes.USERS_PERSON__NUMBER;

      const eventTypeRes      = ParamTypes.USERS_PERSON__DELTA_PT24H;
      const description       = 'USERS_PERSON__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Delta stats for organizations', () => {
    it('Current number of organizations', async () => {
      const eventTypeInitial  = ParamTypes.ORGS_PERSON__NUMBER;

      const eventTypeRes      = ParamTypes.ORGS_PERSON__DELTA_PT24H;
      const description       = 'ORGS_PERSON__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Stats for posts', () => {
    it('Current number of media posts', async () => {
      const eventTypeInitial  = ParamTypes.POSTS_MEDIA__NUMBER;

      const eventTypeRes      = ParamTypes.POSTS_MEDIA__DELTA_PT24H;
      const description       = 'POSTS_MEDIA__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);

    it('Current number of direct posts', async () => {
      const eventTypeInitial  = ParamTypes.POSTS_DIRECT__NUMBER;

      const eventTypeRes      = ParamTypes.POSTS_DIRECT__DELTA_PT24H;
      const description       = 'POSTS_DIRECT__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Stats for tags', () => {
    it('Current number of tags', async () => {
      const eventTypeInitial  = ParamTypes.TAGS_PERSON__NUMBER;

      const eventTypeRes      = ParamTypes.TAGS_PERSON__DELTA_PT24H;
      const description       = 'TAGS_PERSON__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Stats for comments', () => {
    it('Current number of comments on posts', async () => {
      const eventTypeInitial  = ParamTypes.COMMENTS_PARENT__NUMBER;

      const eventTypeRes      = ParamTypes.COMMENTS_PARENT__DELTA_PT24H;
      const description       = 'COMMENTS_PARENT__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);

    it('Current number of replies', async () => {
      const eventTypeInitial  = ParamTypes.COMMENTS_REPLY__NUMBER;

      const eventTypeRes      = ParamTypes.COMMENTS_REPLY__DELTA_PT24H;
      const description       = 'COMMENTS_REPLY__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Stats for votes', () => {
    it('Current number of upvotes', async () => {
      const eventTypeInitial  = ParamTypes.ACTIVITIES_VOTE_UPVOTE__NUMBER;

      const eventTypeRes      = ParamTypes.ACTIVITIES_VOTE_UPVOTE__DELTA_PT24H;
      const description       = 'ACTIVITIES_VOTE_UPVOTE__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);

    it('Current number of downvotes', async () => {
      const eventTypeInitial  = ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER;

      const eventTypeRes      = ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__DELTA_PT24H;
      const description       = 'ACTIVITIES_VOTE_DOWNVOTE__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });

  describe('Reposts', () => {
    it('Current number of reposts of media posts', async () => {
      const eventTypeInitial  = ParamTypes.POSTS_REPOST_MEDIA__NUMBER;

      const eventTypeRes      = ParamTypes.POSTS_REPOST_MEDIA__DELTA_PT24H;
      const description       = 'POSTS_REPOST_MEDIA__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);

    it('Current number of reposts of direct posts', async () => {
      const eventTypeInitial  = ParamTypes.POSTS_REPOST_DIRECT__NUMBER;

      const eventTypeRes      = ParamTypes.POSTS_REPOST_DIRECT__DELTA_PT24H;
      const description       = 'POSTS_REPOST_DIRECT__DELTA_PT24H';

      const sampleData = sampleDataSet[eventTypeInitial];

      await StatsHelper.checkStatsTotalForOneTypeDynamically(
        eventTypeRes,
        sampleData.delta,
        description,
        RECALC_INTERVAL,
        false,
        true,
      );
    }, JEST_TIMEOUT);
  });
});

export {};
