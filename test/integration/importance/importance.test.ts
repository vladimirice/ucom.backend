export {};

const helpers = require('../helpers');
const gen     = require('../../generators');

const importanceEventService        = require('../../../lib/eos/service/importance-event-service');
const entityStatsCurrentRepository
  = require('../../../lib/entities/repository/entity-stats-current-repository');

let userVlad;

helpers.Mock.mockAllBlockchainPart();

describe('UOS Importance', () => {
  beforeAll(async () => {
    [userVlad] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
    helpers.Mock.mockAllBlockchainPart();
  });

  it('posts only workflow - fresh stats table', async () => {
    const dataSet = gen.Entity.EventParam.getSampleDataSet();

    const postIdOne = await gen.Posts.createMediaPostByUserHimself(userVlad);
    const postIdTwo = await gen.Posts.createMediaPostByUserHimself(userVlad);

    await gen.Entity.EventParam.createBasicSample();

    await importanceEventService.updateDeltaRateStats();

    const res =
      await entityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);

    const postOneExpectedDelta = dataSet[0].importance.after - dataSet[0].importance.before;
    const postTwoExpectedDelta = dataSet[1].importance.after - dataSet[1].importance.before;

    expect(+res[postIdOne].toFixed(2)).toBe(+postOneExpectedDelta.toFixed(2));
    expect(+res[postIdTwo].toFixed(2)).toBe(+postTwoExpectedDelta.toFixed(2));
  });

  it('Check situation - no before records (no rating yet) - entity is newcomer-star', async () => {
    const postIdOne = await gen.Posts.createMediaPostByUserHimself(userVlad);
    const postIdTwo = await gen.Posts.createMediaPostByUserHimself(userVlad);

    const dataSet = gen.Entity.EventParam.getSampleDataSet();

    await gen.Entity.EventParam.createBasicSample([], [0]);

    await importanceEventService.updateDeltaRateStats();

    const res =
      await entityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);

    expect(+res[postIdOne].toFixed(2)).toBe(+dataSet[0].importance.after.toFixed(2));

    const postTwoExpectedDelta = dataSet[1].importance.after - dataSet[1].importance.before;
    expect(+res[postIdTwo].toFixed(2)).toBe(+postTwoExpectedDelta.toFixed(2));
  });

  // tslint:disable-next-line:max-line-length
  it('Check situation - no after records (rating is disappeared somehow) - make delta zero', async () => {
    const postIdOne = await gen.Posts.createMediaPostByUserHimself(userVlad);
    const postIdTwo = await gen.Posts.createMediaPostByUserHimself(userVlad);

    const dataSet = gen.Entity.EventParam.getSampleDataSet();

    await gen.Entity.EventParam.createBasicSample([], [], [0]);

    await importanceEventService.updateDeltaRateStats();

    const res =
      await entityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);

    expect(+res[postIdOne].toFixed(2)).toBe(0);

    const postTwoExpectedDelta = dataSet[1].importance.after - dataSet[1].importance.before;
    expect(+res[postIdTwo].toFixed(2)).toBe(+postTwoExpectedDelta.toFixed(2));
  });

  // tslint:disable-next-line:max-line-length
  it('Check second insert must update value and not create new or cause an error. Updated at should be updated but not created at', async () => {
    // Init basic set as for fresh test
    const postIdOne = await gen.Posts.createMediaPostByUserHimself(userVlad);
    const postIdTwo = await gen.Posts.createMediaPostByUserHimself(userVlad);

    await gen.Entity.EventParam.createBasicSample();
    await importanceEventService.updateDeltaRateStats();

    const resBefore =
      await entityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);

    // Update post stats

    const dataSet = gen.Entity.EventParam.getSampleDataSet();
    dataSet[0].importance = {
      before: 10.211208926,
      after: 6.281208926,
    };

    dataSet[1].importance = {
      before: 10.721208926,
      after: 21.281208926,
    };

    await gen.Entity.EventParam.createBasicSample(dataSet);
    await importanceEventService.updateDeltaRateStats();

    const resAfter =
      await entityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);
    expect(Object.keys(resAfter).length).toBe(2);

    expect(+resBefore[postIdOne].toFixed(2)).not.toBe(+resAfter[postIdOne].toFixed(2));
    expect(+resBefore[postIdTwo].toFixed(2)).not.toBe(+resAfter[postIdTwo].toFixed(2));

    const postOneExpectedDelta = dataSet[0].importance.after - dataSet[0].importance.before;
    const postTwoExpectedDelta = dataSet[1].importance.after - dataSet[1].importance.before;

    expect(+resAfter[postIdOne].toFixed(2)).toBe(+postOneExpectedDelta.toFixed(2));
    expect(+resAfter[postIdTwo].toFixed(2)).toBe(+postTwoExpectedDelta.toFixed(2));
  });
});
