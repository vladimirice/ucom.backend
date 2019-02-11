import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');
import PostsGenerator = require('../../generators/posts-generator');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  it('calculate upvotes/downvotes amount for posts', async () => {
    // TODO - also calculate one for organizations - some posts should be from orgs
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
        EventParamTypeDictionary.getCurrentPostVotes(),
      );

    const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
    const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
    const postThreeEvent = postEvents.find(item => +item.entity_id === postThreeId)!;

    expect(postEvents.some(item => +item.entity_id === postFourId)).toBeFalsy();

    expect(postOneEvent.json_value.data).toEqual({
      upvotes: 3,
      downvotes: 0,
    });
    expect(postTwoEvent.json_value.data).toEqual({
      upvotes: 2,
      downvotes: 1,
    });
    expect(postThreeEvent.json_value.data).toEqual({
      upvotes: 0,
      downvotes: 3,
    });
  }, 100000); // TODO
});

export {};
