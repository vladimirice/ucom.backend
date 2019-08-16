/* eslint-disable max-len */
import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../lib/stats/service/entity-job-executor-service';

import OrganizationsGenerator = require('./organizations-generator');
import PostsGenerator = require('./posts-generator');

import activityHelper = require('../integration/helpers/activity-helper');
import orgGen = require('./organizations-generator');
import postGen = require('./posts-generator');
import commentsGen = require('./comments-generator');
import CommentsGenerator = require('./comments-generator');
import PostsHelper = require('../integration/helpers/posts-helper');
import OrganizationsHelper = require('../integration/helpers/organizations-helper');
import EntityTagsGenerator = require('./entity/entity-tags-generator');
import TagsCurrentRateProcessor = require('../../lib/tags/service/tags-current-rate-processor');
import EventParamTypeDictionary = require('../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../integration/helpers/stats-helper');
import TagsRepository = require('../../lib/tags/repository/tags-repository');
import SampleUsersProvider = require('../helpers/users/sample-users-provider');

class CommonGenerator {
  static async createAllTypesOfNotifications() {
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

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

  public static async createFeedsForAllUsers(): Promise<any> {
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

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
      PostsGenerator.createDirectPostForOrganizationLegacy(userVlad, janeOrgIdTwo), // 9
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

  public static async createActivityDisturbance(options: {posts: boolean, orgs: boolean, tags: boolean}) {
    const res: any = {};

    if (options.posts) {
      res.expectedForPosts = await this.createPostsActivityAsDisturbance();
    }

    if (options.orgs) {
      res.expectedForOrgs = await this.createOrgActivityAsDisturbance();
    }

    if (options.tags) {
      res.expectedForTags = await this.createTagsActivityAsDisturbance();
    }

    await EntityJobExecutorService.processEntityEventParam();

    return res;
  }

  private static async createOrgActivityAsDisturbance() {
    const [userVlad, userJane,, userRokky] = await SampleUsersProvider.getAll();

    const [firstOrgId, secondOrgId, thirdOrgId, fourthOrgId] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
      OrganizationsGenerator.createOrgWithoutTeam(userRokky),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),

      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
    ]);

    const orgToImportance = await OrganizationsHelper.setRandomRateToManyOrgs([
      firstOrgId,
      secondOrgId,
      thirdOrgId,
    ]);

    await Promise.all([
      CommonGenerator.createOrgPostsActivity(firstOrgId, secondOrgId, thirdOrgId),
      CommonGenerator.createOrgFollowingActivity(firstOrgId, secondOrgId, thirdOrgId),
      OrganizationsHelper.requestToFollowOrganization(fourthOrgId, userRokky),
    ]);

    return {
      [EventParamTypeDictionary.getCurrentBlockchainImportance()]: orgToImportance,
      [EventParamTypeDictionary.getOrgCurrentActivityIndex()]:
        StatsHelper.getExpectedHardcodedOrgsActivityIndexes(firstOrgId, secondOrgId, thirdOrgId, fourthOrgId),
    };
  }


  private static async createPostsActivityAsDisturbance()
    : Promise<any> {
    const [userVlad] = await SampleUsersProvider.getAll();

    const [firstPostId, secondPostId, thirdPostId, fourthPostId, fifthPostId] = await Promise.all([
      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),

      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),
    ]);

    await CommonGenerator.createPostRepostActivity(fourthPostId);
    await CommonGenerator.createPostCommentsActivity(fifthPostId);

    await CommonGenerator.createPostRepostActivity(firstPostId, secondPostId);
    await CommonGenerator.createPostCommentsActivity(firstPostId, secondPostId);

    await CommonGenerator.createPostVotingActivity(firstPostId, secondPostId, thirdPostId);

    const postToImportance = await PostsHelper.setRandomRateToManyPosts([firstPostId, secondPostId, thirdPostId]);

    return {
      [EventParamTypeDictionary.getCurrentBlockchainImportance()]: postToImportance,
      [EventParamTypeDictionary.getPostCurrentActivityIndex()]:
        StatsHelper.getExpectedHardcodedPostsActivityIndex(firstPostId, secondPostId, thirdPostId, fourthPostId, fifthPostId),
    };
  }

  public static async createPostRepostActivity(
    idForOneRepost: number,
    idForTwoReposts: number | null = null,
  ): Promise<void> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();
    await PostsGenerator.createRepostOfUserPost(userJane, idForOneRepost);

    if (idForTwoReposts !== null) {
      // Post one has two reposts
      await Promise.all([
        PostsGenerator.createRepostOfUserPost(userJane, idForTwoReposts),
        PostsGenerator.createRepostOfUserPost(userPetr, idForTwoReposts),
      ]);
    }
  }

  // Three likes for first post
  // Two likes and one dislike for second post
  // Three dislikes, no likes for third post
  public static async createPostVotingActivity(
    threeLikesPostId,
    twoLikesOneDislikePostId,
    threeDislikesPostId,
  ): Promise<void> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

    await Promise.all([
      PostsHelper.requestToUpvotePost(userJane, threeLikesPostId),
      PostsHelper.requestToUpvotePost(userPetr, threeLikesPostId),
      PostsHelper.requestToUpvotePost(userRokky, threeLikesPostId),
    ]);

    await Promise.all([
      PostsHelper.requestToUpvotePost(userJane, twoLikesOneDislikePostId),
      PostsHelper.requestToUpvotePost(userPetr, twoLikesOneDislikePostId),
      PostsHelper.requestToDownvotePost(userRokky, twoLikesOneDislikePostId),
    ]);

    await Promise.all([
      PostsHelper.requestToDownvotePost(userJane, threeDislikesPostId),
      PostsHelper.requestToDownvotePost(userPetr, threeDislikesPostId),
      PostsHelper.requestToDownvotePost(userRokky, threeDislikesPostId),
    ]);
  }

  public static async createPostCommentsActivity(
    fourCommentsPostId: number,
    oneCommentPostId: number | null = null,
  ): Promise<void> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

    const [postOneCommentOneId] = await Promise.all([
      CommentsGenerator.createCommentForPostAndGetId(fourCommentsPostId, userVlad),
      CommentsGenerator.createCommentForPostAndGetId(fourCommentsPostId, userJane),
    ]);

    await Promise.all([
      CommentsGenerator.createCommentOnComment(fourCommentsPostId, postOneCommentOneId, userPetr),
      CommentsGenerator.createCommentOnComment(fourCommentsPostId, postOneCommentOneId, userRokky),
    ]);

    if (oneCommentPostId !== null) {
      await CommentsGenerator.createCommentForPost(oneCommentPostId, userPetr);
    }
  }

  public static async createOrgFollowingActivity(
    orgIdWithTwoFollowers: number,
    orgIdWithOneFollowerAndHistory: number,
    orgIdWithOneDirectFollower: number,
  ): Promise<void> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

    await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgIdWithTwoFollowers);
    await OrganizationsHelper.requestToFollowOrganization(orgIdWithTwoFollowers, userPetr);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgIdWithTwoFollowers);

    await OrganizationsHelper.requestToFollowOrganization(orgIdWithOneFollowerAndHistory, userPetr);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userVlad, orgIdWithOneFollowerAndHistory);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgIdWithOneFollowerAndHistory);

    await OrganizationsHelper.requestToFollowOrganization(orgIdWithOneDirectFollower, userRokky);
  }

  public static async createOrgPostsActivity(
    orgIdWithThreeMediaAndTwoDirectPosts: number,
    orgIdWithOneDirectPost: number,
    orgIdWithOneMediaPost: number,
  ): Promise<void> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

    await Promise.all([
      PostsGenerator.createManyMediaPostsOfOrganization(userVlad, orgIdWithThreeMediaAndTwoDirectPosts, 3),
      PostsGenerator.createDirectPostForOrganizationLegacy(userJane, orgIdWithThreeMediaAndTwoDirectPosts),
      PostsGenerator.createDirectPostForOrganizationLegacy(userPetr, orgIdWithThreeMediaAndTwoDirectPosts),

      PostsGenerator.createDirectPostForOrganizationLegacy(userPetr, orgIdWithOneDirectPost),
      PostsGenerator.createMediaPostOfOrganization(userRokky, orgIdWithOneMediaPost),
    ]);
  }

  public static async createTagsPostsActivity(
    tagTitleWithTwoMediaAndOneDirect: string,
    tagTitleWithOneMedia: string,
    tagTitleWithOneDirect: string,
  ): Promise<number[]> {
    // @ts-ignore
    const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();

    return Promise.all([
      EntityTagsGenerator.createTagViaNewPost(userVlad, tagTitleWithTwoMediaAndOneDirect),
      EntityTagsGenerator.createTagViaNewPost(userVlad, tagTitleWithTwoMediaAndOneDirect),
      EntityTagsGenerator.createTagViaNewDirectPost(userVlad, userJane, tagTitleWithTwoMediaAndOneDirect),

      EntityTagsGenerator.createTagViaNewPost(userVlad, tagTitleWithOneMedia),

      EntityTagsGenerator.createTagViaNewDirectPost(userJane, userVlad, tagTitleWithOneDirect),
    ]);
  }

  private static async createTagsActivityAsDisturbance() {
    const firstTagTitle     = 'summer';
    const secondTagTitle    = 'autumn';
    const thirdTagTitle     = 'winter';

    const [firstPostId, secondPostId] = await CommonGenerator.createTagsPostsActivity(
      firstTagTitle,
      secondTagTitle,
      thirdTagTitle,
    );

    await PostsHelper.setRandomRateToManyPosts([firstPostId, secondPostId], false);
    await TagsCurrentRateProcessor.process();

    const [firstTagModel, secondTagModel, thirdTagModel] = await Promise.all([
      TagsRepository.findOneByTitle(firstTagTitle),
      TagsRepository.findOneByTitle(secondTagTitle),
      TagsRepository.findOneByTitle(thirdTagTitle),
    ]);

    return {
      [EventParamTypeDictionary.getTagCurrentActivityIndex()]:
        StatsHelper.getExpectedHardcodedTagsActivityIndexes(
          firstTagModel!.id,
          secondTagModel!.id,
          thirdTagModel!.id,
        ),
    };
  }
}

export = CommonGenerator;
