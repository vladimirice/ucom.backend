import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');

let userVlad: UserModel;

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => {
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine(true);
  });

  it('thisissample', async () => {
    await PostsGenerator.createMediaPostByUserHimself(userVlad);

    await EntityJobExecutorService.processEntityEventParam();
  });
});

export {};
