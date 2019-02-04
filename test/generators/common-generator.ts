import { UserModel } from '../../lib/users/interfaces/model-interfaces';

import OrganizationsGenerator = require('./organizations-generator');
import PostsGenerator = require('./posts-generator');

import activityHelper = require('../integration/helpers/activity-helper');
import orgGen = require('./organizations-generator');
import postGen = require('./posts-generator');
import commentsGen = require('./comments-generator');

class CommonGenerator {
  static async createAllTypesOfNotifications(userVlad, userJane, userPetr, userRokky) {
    // User Jane = 1 - vlad follows you
    await activityHelper.requestToCreateFollow(userVlad, userJane);

    // User Jane = 2 - vlad invites you to his org
    const teamMembers = [userJane, userPetr];
    await orgGen.createOrgWithTeam(userVlad, teamMembers);

    // User Jane = 3 - Rokky follows your organization
    const orgId = await orgGen.createOrgWithoutTeam(userJane);
    await activityHelper.requestToFollowOrganization(orgId, userRokky);

    // User Jane = 4 - User vlad comments your post
    const postId = await postGen.createMediaPostByUserHimself(userJane);
    await commentsGen.createCommentForPost(postId, userPetr);

    // User Jane = 5 - comments her own post. As is
    const newJaneComment = await commentsGen.createCommentForPost(postId, userJane);

    // User Jane = 6 - User Rokky comments her comment
    await commentsGen.createCommentOnComment(postId, newJaneComment.id, userRokky);
  }

  public static async createFeedsForAllUsers(
    userVlad: UserModel,
    userJane: UserModel,
    userPetr: UserModel,
    userRokky: UserModel,
  ): Promise<any> {
    const [janeOrgIdOne, janeOrgIdTwo] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
    ]);

    // Myself posts
    const promisesToCreatePosts = [
      // ======= Vlad wall ========

      // User himself creates posts
      PostsGenerator.createMediaPostByUserHimself(userVlad), // 0
      // somebody creates post in users wall
      PostsGenerator.createUserDirectPostForOtherUser(userJane, userVlad), // 1

      // ======= Jane wall =========

      // User himself creates posts
      PostsGenerator.createMediaPostByUserHimself(userJane), // 2
      // somebody creates post in users wall
      PostsGenerator.createUserDirectPostForOtherUser(userVlad, userJane), // 3

      // ======= Peter wall =========

      // User himself creates posts
      PostsGenerator.createMediaPostByUserHimself(userPetr), // 4
      // somebody creates post in users wall
      PostsGenerator.createUserDirectPostForOtherUser(userRokky, userPetr), // 5

      // ======= Rokky wall ============
      // User himself creates posts
      PostsGenerator.createMediaPostByUserHimself(userRokky), // 6
      // somebody creates post in users wall
      PostsGenerator.createUserDirectPostForOtherUser(userPetr, userRokky), // 7

      // ======== Jane Org wall ==========
      PostsGenerator.createMediaPostOfOrganization(userJane, janeOrgIdOne), // 8
      PostsGenerator.createDirectPostForOrganization(userVlad, janeOrgIdTwo), // 9
    ];

    const usersToFollow: UserModel[] = [
      userJane,
      userPetr,
    ];

    const usersToUnfollow: UserModel[] = [
      userRokky,
    ];

    await activityHelper.requestToCreateFollowUnfollowHistoryOfUsers(
      userVlad,
      usersToFollow,
      usersToUnfollow,
    );
    await activityHelper.requestToCreateFollowUnfollowHistoryOfOrgs(
      userVlad,
      [janeOrgIdOne, janeOrgIdTwo],
    );

    // @ts-ignore
    const posts = await Promise.all(promisesToCreatePosts);

    const responsePosts = {
      org: {
        [janeOrgIdOne]: posts[8],
      },
      raw: posts,
    };

    const orgs = {
      [userJane.id]: [
        janeOrgIdOne,
        janeOrgIdTwo,
      ],
    };

    return {
      posts: responsePosts,
      orgs,
    };
  }
}

export = CommonGenerator;
