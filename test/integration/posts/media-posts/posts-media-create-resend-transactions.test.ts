import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import MediaPostResendingService = require('../../../../lib/posts/service/content-resending/media-post-resending-service');
import OrganizationsGenerator = require('../../../generators/organizations-generator');

const moment = require('moment');

let userVlad: UserModel;

const JEST_TIMEOUT = 15000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

beforeAll(async () => {
  await SeedsHelper.noGraphQlNoMocking();
});
afterAll(async () => {
  await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
});
beforeEach(async () => {
  [userVlad] = await SeedsHelper.beforeAllRoutine();
});

describe('Media post resending to the blockchain', () => {
  it('Smoke - update media post from user providing a transaction', async () => {
    const now = moment().add(1, 'h').utc().format();

    await PostsGenerator.createMediaPostByUserHimself(userVlad, {
      description: 'hello there #winter #summer',
    });

    const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

    await MediaPostResendingService.resendMediaPosts(now, 100);
  }, JEST_TIMEOUT * 3);
});

export {};
