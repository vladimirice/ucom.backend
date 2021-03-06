import RequestHelper = require('../../helpers/request-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import UsersHelper = require('../../helpers/users-helper');
import ActivityHelper = require('../../helpers/activity-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import ResponseHelper = require('../../helpers/response-helper');
import UsersRepository = require('../../../../lib/users/users-repository');
import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import CommonChecker = require('../../../helpers/common/common-checker');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

const JEST_TIMEOUT = 5000;

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Myself. Get requests', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlMockAllWorkers();
  }, JEST_TIMEOUT * 3);

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
  });

  describe('Get myself data', () => {
    describe('scaled importance', () => {
      it('myself data should include scaled importance greater than zero', async () => {
        const user = await OneUserRequestHelper.getMyself(userVlad);

        const dbUser = await UsersRepository.getUserById(userVlad.id);
        UsersHelper.validateUserJson(user, userVlad, dbUser);

        CommonChecker.expectAllFieldsPositiveOrZeroNumber(user, ['scaled_importance', 'scaled_importance_delta']);
      }, JEST_TIMEOUT);

      it('myself data should include zero scaled importance if no stats yet', async () => {
        const response = await request(server)
          .get(RequestHelper.getMyselfUrl())
          .set('Authorization', `Bearer ${userVlad.token}`);

        const { body } = response;

        const dbUser = await UsersRepository.getUserById(userVlad.id);

        UsersHelper.validateUserJson(body, userVlad, dbUser);

        expect(body.scaled_importance).toBeGreaterThanOrEqual(0);
      }, JEST_TIMEOUT);
    });

    it('should be field unread_messages_count', async () => {
      const res = await request(server)
        .get(RequestHelper.getMyselfUrl())
        .set('Authorization', `Bearer ${userVlad.token}`);
      expect(res.body.unread_messages_count).toBeDefined();
    });

    it('Get logged user data', async () => {
      const res = await request(server)
        .get(RequestHelper.getMyselfUrl())
        .set('Authorization', `Bearer ${userVlad.token}`);
      expect(res.status).toBe(200);
      const user = await UsersRepository.getUserById(userVlad.id);

      UsersHelper.validateUserJson(res.body, userVlad, user);
    });

    it('should get correct users_ids and org_ids I follow', async () => {
      // This is unit test

      // noinspection JSDeprecatedSymbols
      await SeedsHelper.seedOrganizations();

      const myself = userVlad;
      const usersToFollow = [userJane, userPetr];
      const usersToUnfollow = [userRokky];

      const { usersIdsToFollow } = await ActivityHelper.requestToCreateFollowUnfollowHistoryOfUsers(
        myself,
        usersToFollow,
        usersToUnfollow,
      );

      const orgIdsToFollow = [1, 3, 4];
      const orgIdsToUnfollow = [2, 5];

      await ActivityHelper.requestToCreateFollowUnfollowHistoryOfOrgs(
        myself,
        orgIdsToFollow,
        orgIdsToUnfollow,
      );

      const { usersIds, orgIds } = await UsersActivityRepository.findOneUserFollowActivity(myself.id);

      expect(usersIds.sort()).toEqual(usersIdsToFollow.sort());
      expect(orgIds.sort()).toEqual(orgIdsToFollow.sort());
    });
  });

  describe('Get myself news feed', () => {
    describe('Positive', () => {
      describe('Test pagination', () => {
        it.skip('Test pagination', async () => {
        });
      });

      it('should get myself news feed with repost_available which is set properly', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        await ActivityHelper.requestToCreateFollow(repostAuthor, parentPostAuthor);

        const [postIdToRepost, secondPostIdToRepost, postIdNotToRepost, secondPostIdNotToRepost] = await Promise.all([
          PostsGenerator.createMediaPostByUserHimself(parentPostAuthor),
          PostsGenerator.createMediaPostByUserHimself(parentPostAuthor),
          PostsGenerator.createMediaPostByUserHimself(parentPostAuthor),
          PostsGenerator.createMediaPostByUserHimself(parentPostAuthor),
        ]);

        await Promise.all([
          PostsGenerator.createRepostOfUserPost(repostAuthor, postIdToRepost),
          PostsGenerator.createRepostOfUserPost(repostAuthor, secondPostIdToRepost),
        ]);

        const posts = await UsersHelper.requestToGetMyselfNewsFeed(repostAuthor);

        posts.forEach((post) => {
          expect(post.myselfData.repost_available).toBeDefined();
        });

        const repostedPost = posts.find((post) => post.id === postIdToRepost);
        expect(repostedPost).toBeDefined();
        expect(repostedPost.myselfData.repost_available).toBeFalsy();

        const secondRepostedPost = posts.find((post) => post.id === secondPostIdToRepost);
        expect(secondRepostedPost).toBeDefined();
        expect(secondRepostedPost.myselfData.repost_available).toBeFalsy();

        const notRepostedPost = posts.find((post) => post.id === postIdNotToRepost);
        expect(notRepostedPost).toBeDefined();
        expect(notRepostedPost.myselfData.repost_available).toBeTruthy();

        const secondNotRepostedPost = posts.find((post) => post.id === secondPostIdNotToRepost);
        expect(secondNotRepostedPost).toBeDefined();
        expect(secondNotRepostedPost.myselfData.repost_available).toBeTruthy();
      });

      it('should get myself news feed with posts of entities I follow', async () => {
        await SeedsHelper.seedOrganizations();

        const janeOrgIdOne = 3;
        const janeOrgIdTwo = 4;

        // Myself posts
        const promisesToCreatePosts: any[] = [
          // Vlad wall
          PostsGenerator.createMediaPostByUserHimself(userVlad), // User himself creates posts
          PostsGenerator.createPostOfferByUserHimself(userVlad),
          PostsGenerator.createUserDirectPostForOtherUserV2(
            userJane,
            userVlad,
          ), // somebody creates post in users wall

          // Jane wall
          PostsGenerator.createMediaPostByUserHimself(userJane), // User himself creates posts
          PostsGenerator.createPostOfferByUserHimself(userJane),
          PostsGenerator.createUserDirectPostForOtherUser(
            userVlad,
            userJane,
          ), // somebody creates post in users wall

          // Peter wall
          PostsGenerator.createMediaPostByUserHimself(userPetr), // User himself creates posts
          PostsGenerator.createPostOfferByUserHimself(userPetr),

          PostsGenerator.createUserDirectPostForOtherUserV2(
            userRokky,
            userPetr,
          ), // somebody creates post in users wall

          // Rokky wall
          PostsGenerator.createMediaPostByUserHimself(userRokky), // User himself creates posts
          PostsGenerator.createPostOfferByUserHimself(userRokky),
          PostsGenerator.createUserDirectPostForOtherUserV2(
            userPetr,
            userRokky,
          ), // somebody creates post in users wall

          // Jane Org wall
          PostsGenerator.createMediaPostOfOrganization(userJane, janeOrgIdOne),
          PostsGenerator.createPostOfferOfOrganization(userJane, janeOrgIdTwo),

          PostsGenerator.createDirectPostForOrganizationV2(userVlad, janeOrgIdTwo),
        ];

        const usersToFollow = [
          userJane,
          userPetr,
        ];

        const usersToUnfollow = [
          userRokky,
        ];

        await ActivityHelper.requestToCreateFollowUnfollowHistoryOfUsers(
          userVlad,
          usersToFollow,
          usersToUnfollow,
        );
        await ActivityHelper.requestToCreateFollowUnfollowHistoryOfOrgs(
          userVlad,
          [janeOrgIdOne, janeOrgIdTwo],
        );

        // Vlad is following jane and petr but not rokky
        // News feed should consist of vlad wall + jane wall + petr wall

        // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
        const [
          vladMediaPost, vladPostOffer, vladDirectPost,
          janeMediaPost, janePostOffer, janeDirectPost,
          petrMediaPost, petrPostOffer, petrDirectPost,, , ,

          janeMediaPostOrg, janePostOfferOrg, janeDirectPostOrg,
        ] = await Promise.all(promisesToCreatePosts);

        const queryString = RequestHelper.getPaginationQueryString(1, 20);

        const posts = await UsersHelper.requestToGetMyselfNewsFeed(userVlad, queryString);

        posts.forEach((post) => {
          expect(post.description).toBeDefined();
        });

        expect(posts.some((post) => post.id === vladMediaPost)).toBeTruthy();
        expect(posts.some((post) => post.id === vladPostOffer)).toBeTruthy();
        expect(posts.some((post) => post.id === vladDirectPost.id)).toBeTruthy();

        expect(posts.some((post) => post.id === janeMediaPost)).toBeTruthy();
        expect(posts.some((post) => post.id === janePostOffer)).toBeTruthy();
        expect(posts.some((post) => post.id === janeDirectPost.id)).toBeTruthy();

        expect(posts.some((post) => post.id === petrMediaPost)).toBeTruthy();
        expect(posts.some((post) => post.id === petrPostOffer)).toBeTruthy();
        expect(posts.some((post) => post.id === petrDirectPost.id)).toBeTruthy();

        expect(posts.some((post) => post.id === janeMediaPostOrg)).toBeTruthy();
        expect(posts.some((post) => post.id === janePostOfferOrg)).toBeTruthy();
        expect(posts.some((post) => post.id === janeDirectPostOrg.id)).toBeTruthy();
      });
    });

    describe('Negative', () => {
      it('should not be possible to get news-feed without auth token', async () => {
        const url = RequestHelper.getMyselfNewsFeedUrl();

        const res = await request(server)
          .get(url);
        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });
});

export {};
