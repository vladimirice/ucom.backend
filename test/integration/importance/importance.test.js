const helpers = require('../helpers');
const gen     = require('../../generators');

const PostsModelProvider            = require('../../../lib/posts/service/posts-model-provider');
const ImportanceEventService        = require('../../../lib/eos/service/importance-event-service');
const EntityStatsCurrentRepository  = require('../../../lib/entities/repository/entity-stats-current-repository');

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('UOS Importance', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  it('posts only workflow - fresh stats table', async () => {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: '2018-11-22 00:00:00.999275',
    };

    const dataSet = [
      {
        blockchain_id: 'sample_user_himself_new_post_blockchain_id_1', // this structure is generated inside mock function
        entity_name: PostsModelProvider.getEntityName(),
        event_type: 1,
        importance: {
          before: 7.721208926,
          after: 10.211208926,
        },
        created_at: createdAtSet,
      },
      {
        blockchain_id: 'sample_user_himself_new_post_blockchain_id_2', // this structure is generated inside mock function
        entity_name: PostsModelProvider.getEntityName(),
        event_type: 1,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },
      // disturbance
      {
        blockchain_id: 'sample_anything', // this structure is generated inside mock function
        entity_name: 'org       ',
        event_type: 1,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },

      // disturbance
      {
        blockchain_id: 'other_sample_anything', // this structure is generated inside mock function
        entity_name: 'users     ',
        event_type: 10,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },
    ];

    const postIdOne = await gen.Posts.createMediaPostByUserHimself(userVlad);
    const postIdTwo = await gen.Posts.createMediaPostByUserHimself(userVlad);

    await gen.Entity.EventParam.createBasicSample(dataSet);

    await ImportanceEventService.updateDeltaRateStats();

    const res = await EntityStatsCurrentRepository.getImportanceDeltaForPosts([postIdOne, postIdTwo]);

    const postOneExpectedDelta = dataSet[0].importance.after - dataSet[0].importance.before;
    const postTwoExpectedDelta = dataSet[1].importance.after - dataSet[1].importance.before;

    expect(+res[postIdOne].toFixed(2)).toBe(+postOneExpectedDelta.toFixed(2));
    expect(+res[postIdTwo].toFixed(2)).toBe(+postTwoExpectedDelta.toFixed(2));
  });

  it.skip('Check situation - no before records (no rating yet) - entity is newcomer-star', async () => {
    // TODO
  });

  it.skip('Check situation - no after records (rating is disappeared somehow) - make delta maximum', async () => {
    // TODO
  });

  it.skip('Check second insert must update value and not create new or cause an error. Updated at should be updated but not created at', async () => {
    // TODO
  });
});
