import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import PostsHelper = require('../helpers/posts-helper');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  it('thisissample', async () => {
    const postOneId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    const expectedPostOneRate = 2.321321;
    await PostsHelper.setSampleRateToPost(postOneId, expectedPostOneRate);

    await EntityJobExecutorService.processEntityEventParam();
  });
});

export {};
