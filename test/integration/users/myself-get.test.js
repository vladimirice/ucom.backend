const helpers = require('../helpers');
const gen = require('../../generators');

const UsersRepository = require('./../../../lib/users/users-repository');
const request = require('supertest');
const server = require('../../../app');

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

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
    await helpers.Seeds.initUsersOnly();
  });

  describe('Get myself data', function () {
    it('should be field unread_messages_count', async () => {
      const userVlad = await helpers.Users.getUserVlad();

      const res = await request(server)
        .get(helpers.Req.getMyselfUrl())
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      expect(res.body.unread_messages_count).toBeDefined();
    });

    it('Get logged user data', async function ()  {
      const userVlad = await helpers.Users.getUserVlad();

      const res = await request(server)
        .get(helpers.Req.getMyselfUrl())
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      expect(res.status).toBe(200);
      const user = await UsersRepository.getUserById(userVlad.id);

      helpers.Users.validateUserJson(res.body, userVlad, user);
    });
  });

  describe('Get myself news feed', () => {
    describe('Positive', () => {
      describe('Test pagination', () => {
        it.skip('Test pagination', async () => {
        });
      });

      it('should get correct users_ids and org_ids I follow', async () => {
        // This is unit test

        // noinspection JSDeprecatedSymbols
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

      it('should get myself news feed with repost_available which is set properly', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        await helpers.Activity.requestToCreateFollow(repostAuthor, parentPostAuthor);

        const [postIdToRepost, secondPostIdToRepost, postIdNotToRepost, secondPostIdNotToRepost] =
          await Promise.all([
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
          ]);

        await Promise.all([
          gen.Posts.createRepostOfUserPost(repostAuthor, postIdToRepost),
          gen.Posts.createRepostOfUserPost(repostAuthor, secondPostIdToRepost)
        ]);

        const posts = await helpers.Users.requestToGetMyselfNewsFeed(repostAuthor);

        posts.forEach(post => {
          expect(post.myselfData.repost_available).toBeDefined();
        });

        const repostedPost = posts.find(post => post.id === postIdToRepost);
        expect(repostedPost).toBeDefined();
        expect(repostedPost.myselfData.repost_available).toBeFalsy();

        const secondRepostedPost = posts.find(post => post.id === secondPostIdToRepost);
        expect(secondRepostedPost).toBeDefined();
        expect(secondRepostedPost.myselfData.repost_available).toBeFalsy();

        const notRepostedPost = posts.find(post => post.id === postIdNotToRepost);
        expect(notRepostedPost).toBeDefined();
        expect(notRepostedPost.myselfData.repost_available).toBeTruthy();

        const secondNotRepostedPost = posts.find(post => post.id === secondPostIdNotToRepost);
        expect(secondNotRepostedPost).toBeDefined();
        expect(secondNotRepostedPost.myselfData.repost_available).toBeTruthy();
      });

      it('should get myself news feed with posts of entities I follow', async () => {
        await helpers.Seeds.seedOrganizations();

        const janeOrgIdOne = 3;
        const janeOrgIdTwo = 4;

        // Myself posts
        const promisesToCreatePosts = [
          // Vlad wall
          gen.Posts.createMediaPostByUserHimself(userVlad), // User himself creates posts
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

        const queryString = helpers.Req.getPaginationQueryString(1, 20);

        const posts = await helpers.Users.requestToGetMyselfNewsFeed(userVlad, queryString);

        posts.forEach(post => {
          expect(post.description).toBeDefined();
        });

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
    });

    describe('Negative', () => {
      it('should not be possible to get news-feed without auth token', async () => {
        const url = helpers.Req.getMyselfNewsFeedUrl();

        const res = await request(server)
          .get(url)
        ;

        helpers.Res.expectStatusUnauthorized(res);
      });
    });
  });
});