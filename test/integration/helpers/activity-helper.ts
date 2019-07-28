import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('./request-helper');
import ResponseHelper = require('./response-helper');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');

const delay = require('delay');
const request = require('supertest');

const server = RequestHelper.getApiApplication();

class ActivityHelper {
  static async requestToCreateFollow(
    whoActs: UserModel,
    targetUser: UserModel,
    expectedStatus: number = 201,
  ): Promise<any> {
    const res = await request(server)
      .post(RequestHelper.getFollowUrl(targetUser.id))
      .set('Authorization', `Bearer ${whoActs.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} userFrom
   * @return {Promise<*>}
   */
  static async requestToWaitAndGetTransaction(userFrom) {
    let activity = null;

    while (!activity) {
      activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userFrom.id);
      await delay(200);
    }

    return activity;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} whoActs
   * @param {Object[]} usersToFollow
   * @param {Object[]} usersToUnfollow
   * @return {Promise<void>}
   */
  static async requestToCreateFollowUnfollowHistoryOfUsers(
    whoActs,
    usersToFollow: UserModel[] = [],
    usersToUnfollow: UserModel[] = [],
  ) {
    const usersIdsToFollow: any    = [];
    const usersIdsToUnfollow: any  = [];

    for (const user of usersToFollow) {
      usersIdsToFollow.push(user.id);

      await this.requestToCreateFollowHistory(whoActs, user);
    }

    for (const user of usersToUnfollow) {
      usersIdsToUnfollow.push(user.id);

      await this.requestToCreateUnfollowHistory(whoActs, user);
    }

    // noinspection JSUnusedGlobalSymbols
    return {
      usersIdsToFollow,
      usersIdsToUnfollow,
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} whoActs
   * @param {number[]} idsToFollow
   * @param {number[]} idsToUnfollow
   * @return {Promise<void>}
   */
  static async requestToCreateFollowUnfollowHistoryOfOrgs(
    whoActs,
    idsToFollow: number[] = [],
    idsToUnfollow: number[] = [],
  ) {
    for (const current of idsToFollow) {
      await this.requestToCreateOrgFollowHistory(whoActs, current);
    }

    for (const current of idsToUnfollow) {
      await this.requestToCreateOrgUnfollowHistory(whoActs, current);
    }
  }

  static async requestToCreateFollowHistory(
    whoActs: UserModel,
    targetUser: UserModel,
  ): Promise<void> {
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
  }

  static async requestToCreateUnfollowHistory(
    whoActs: UserModel,
    targetUser: UserModel,
  ): Promise<void> {
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
  }

  static async requestToCreateOrgFollowHistory(
    whoActs: UserModel,
    targetOrgId: number,
  ): Promise<void> {
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
    await this.requestToFollowOrganization(targetOrgId, whoActs);
  }

  static async requestToCreateOrgUnfollowHistory(
    whoActs: UserModel,
    targetOrgId: number,
  ): Promise<void> {
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
  }

  static async requestToFollowOrganization(
    orgId: number,
    user: UserModel,
    expectedStatus: number = 201,
  ): Promise<any> {
    const res = await request(server)
      .post(RequestHelper.getOrgFollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static async requestToUnfollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getOrgUnfollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} whoActs
   * @param {Object} targetUser
   * @param {number} expectedStatus
   * @returns {Promise<{Object}>}
   */
  static async requestToCreateUnfollow(whoActs, targetUser, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getUnfollowUrl(targetUser.id))
      .set('Authorization', `Bearer ${whoActs.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  // noinspection JSUnusedGlobalSymbols
  static async createJoin(userJoined, postIdTo) {
    const res = await request(server)
      .post(RequestHelper.getJoinUrl(postIdTo))
      .set('Authorization', `Bearer ${userJoined.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
  }
}

export = ActivityHelper;
