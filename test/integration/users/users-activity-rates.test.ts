import postService from '../../../lib/posts/post-service';

import PostsHelper = require('../helpers/posts-helper');
import UsersHelper = require('../helpers/users-helper');

export {};

// eslint-disable-next-line node/no-missing-require
const helpers = require('../helpers');
// eslint-disable-next-line node/no-missing-require
const seedsHelper = require('../helpers/seeds-helper');

let userVlad;
let userJane;

describe('Users activity stats', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  describe('User rate', () => {
    it('User rate must be normalized', async () => {
      const expectedRate = await helpers.UserHelper.setSampleRateToUser(userVlad);

      const user = await helpers.UserHelper.requestUserById(userVlad.id);

      expect(user.current_rate).toBe(expectedRate);
    });

    it('Post Offer team users rate must be normalized', async () => {
      const sampleRate = 0.456;

      const [expectedVladRate, expectedJaneRate] = await Promise.all([
        UsersHelper.setSampleRateToUser(userVlad),
        UsersHelper.setSampleRateToUser(userJane, sampleRate),
      ]);

      const firstPostBefore = await postService.findLastPostOfferByAuthor(userVlad.id);

      await PostsHelper.requestToSetPostTeam(
        firstPostBefore.id,
        userVlad,
        [userVlad, userJane],
      );

      const post = await helpers.PostHelper.requestToGetOnePostAsGuest(firstPostBefore.id);

      const team = post.post_users_team;

      const teamVlad = team.find((member) => member.id === userVlad.id);
      expect(teamVlad.current_rate).toBe(expectedVladRate);

      const teamJane = team.find((member) => member.id === userJane.id);
      expect(teamJane.current_rate).toBe(expectedJaneRate);
    }, 1000000);
  });
});
