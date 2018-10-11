const helpers = require('../helpers');

helpers.Mock.mockAllBlockchainPart();


const UsersActivityRepository = require('../../../lib/users/repository').Activity;

let userVlad, userJane, userPetr, userRokky;

describe('Myself. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Get myself news feed', () => {
    describe('Positive', () => {
      it('should get correct users_ids and org_ids I follow', async () => {
        // This is unit test

        await helpers.Seeds.seedOrganizations();

        const myself = userVlad;
        const usersToFollow   = [ userJane, userPetr ];
        const usersToUnfollow = [ userRokky ];

        const { usersIdsToFollow } =
          await helpers.Activity.requestToCreateFollowUnfollowHistoryOfUsers(myself, usersToFollow, usersToUnfollow);

        const orgIdsToFollow   = [ 1, 3, 4 ];
        const orgIdsToUnfollow = [ 2, 5 ];

        await helpers.Activity.requestToCreateFollowUnfollowHistoryOfOrgs(myself, orgIdsToFollow, orgIdsToUnfollow);

        const { usersIds, orgIds } = await UsersActivityRepository.findOneUserFollowActivity(myself.id);

        expect(usersIds.sort()).toEqual(usersIdsToFollow.sort());
        expect(orgIds.sort()).toEqual(orgIdsToFollow.sort());
      });

      it('should get myself news feed with posts of entities I follow', async () => {
        await helpers.Seeds.seedOrganizations();

        const janeOrgIdOne = 3;
        const janeOrgIdTwo = 4;

        // Myself posts
        const promisesToCreatePosts = [
          // Vlad wall
          helpers.Posts.requestToCreateMediaPost(userVlad), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(userVlad),
          helpers.Posts.requestToCreateDirectPostForUser(userJane, userVlad), // somebody creates post in users wall

          // Jane wall
          helpers.Posts.requestToCreateMediaPost(userJane), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(userJane),
          helpers.Posts.requestToCreateDirectPostForUser(userVlad, userJane), // somebody creates post in users wall

          // Peter wall
          helpers.Posts.requestToCreateMediaPost(userPetr), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(userPetr),

          helpers.Posts.requestToCreateDirectPostForUser(userRokky, userPetr), // somebody creates post in users wall

          // Rokky wall
          helpers.Posts.requestToCreateMediaPost(userRokky), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(userRokky),
          helpers.Posts.requestToCreateDirectPostForUser(userPetr, userRokky), // somebody creates post in users wall

          // Jane Org wall
          helpers.Posts.requestToCreateMediaPostOfOrganization(userJane, janeOrgIdOne),
          helpers.Posts.requestToCreatePostOfferOfOrganization(userJane, janeOrgIdTwo),

          helpers.Posts.requestToCreateDirectPostForOrganization(userVlad, janeOrgIdTwo),
        ];

        const usersToFollow = [
          userJane,
          userPetr,
        ];

        const usersToUnfollow = [
          userRokky
        ];

        await helpers.Activity.requestToCreateFollowUnfollowHistoryOfUsers(userVlad, usersToFollow, usersToUnfollow);
        await helpers.Activity.requestToCreateFollowUnfollowHistoryOfOrgs(userVlad, [janeOrgIdOne, janeOrgIdTwo]);

        // Vlad is following jane and petr but not rokky
        // News feed should consist of vlad wall + jane wall + petr wall

        // noinspection JSUnusedLocalSymbols
        const [
          vladMediaPost,  vladPostOffer,  vladDirectPost,
          janeMediaPost,  janePostOffer,  janeDirectPost,
          petrMediaPost,  petrPostOffer,  petrDirectPost,
          rokkyMediaPost, rokkyPostOffer, rokkyDirectPost,

          janeMediaPostOrg, janePostOfferOrg, janeDirectPostOrg
        ] = await Promise.all(promisesToCreatePosts);

        const posts = await helpers.Users.requestToGetMyselfNewsFeed(userVlad);

        expect(posts.some(post => post.id === vladMediaPost)).toBeTruthy();
        expect(posts.some(post => post.id === vladPostOffer)).toBeTruthy();
        expect(posts.some(post => post.id === vladDirectPost.id)).toBeTruthy();

        expect(posts.some(post => post.id === janeMediaPost)).toBeTruthy();
        expect(posts.some(post => post.id === janePostOffer)).toBeTruthy();
        expect(posts.some(post => post.id === janeDirectPost.id)).toBeTruthy();

        expect(posts.some(post => post.id === petrMediaPost)).toBeTruthy();
        expect(posts.some(post => post.id === petrPostOffer)).toBeTruthy();
        expect(posts.some(post => post.id === petrDirectPost.id)).toBeTruthy();

        expect(posts.some(post => post.id === janeMediaPostOrg.id)).toBeTruthy();
        expect(posts.some(post => post.id === janePostOfferOrg)).toBeTruthy();
        expect(posts.some(post => post.id === janeDirectPostOrg.id)).toBeTruthy();
      });

      it('should see myself wall-feed inside myself news-feed', async () => {
        // TODO
      });
    });

    describe('Negative', () => {
      it('should not be possible to get news-feed without auth token', async () => {
        // TODO
      });
    });
  });
});