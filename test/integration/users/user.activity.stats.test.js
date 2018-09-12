const helpers = require('../helpers');
const PostService = require('../../../lib/posts/post-service');

const SeedsHelper = require('../helpers/seeds-helper');

let userVlad, userJane;

describe('Users activity stats', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('User rate', () => {
    it('User rate must be normalized', async () => {
      const expectedRate = await UserHelper.setSampleRateToUser(userVlad);

      const user = await UserHelper.requestUserById(userVlad.id);

      expect(user.current_rate).toBe(expectedRate);
    });

    it('Post Offer team users rate must be normalized', async () => {

      // noinspection JSCheckFunctionSignatures
      const [expectedVladRate, expectedJaneRate] = await Promise.all([
        helpers.UserHelper.setSampleRateToUser(userVlad),
        helpers.UserHelper.setSampleRateToUser(userJane, 0.456)
      ]);

      const firstPostBefore = await PostService.findLastPostOfferByAuthor(userVlad.id);

      await helpers.PostHelper.requestToSetPostTeam(firstPostBefore.id, userVlad, [userVlad, userJane]);

      const post = await helpers.PostHelper.requestToGetOnePostAsGuest(firstPostBefore.id);

      const team = post['post_users_team'];

      const teamVlad = team.find(member => member.id === userVlad.id);
      expect(teamVlad.current_rate).toBe(expectedVladRate);

      const teamJane = team.find(member => member.id === userJane.id);
      expect(teamJane.current_rate).toBe(expectedJaneRate);
    });

    it('Update post-offer by its author', async () => {
      // const userVlad = await UserHelper.getUserVlad();



      // ResponseHelper.expectStatusOk(res);
    })

  });

  it('Get user followers list', async () => {
    // TODO
    // Get user followers list inside user data
    // get followers list inside myself data
  });
});