import {UserModel} from "../../../lib/users/interfaces/model-interfaces";

const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');
const request = require('supertest');
const server = require('../../../app');

const delay = require('delay');

const usersActivityRepository = require('../../../lib/users/repository').Activity;

class ActivityHelper {
  static async requestToCreateFollow(
    whoActs: UserModel,
    targetUser: UserModel,
    expectedStatus: number = 201,
  ): Promise<any> {
    const res = await request(server)
      .post(requestHelper.getFollowUrl(targetUser.id))
      .set('Authorization', `Bearer ${whoActs.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
      activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(userFrom.id);
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

    for (let i = 0; i < usersToFollow.length; i += 1) {
      const user: any = usersToFollow[i];

      usersIdsToFollow.push(user.id);

      await this.requestToCreateFollowHistory(whoActs, user);
    }

    for (let i = 0; i < usersToUnfollow.length; i += 1) {
      const user: any = usersToUnfollow[i];

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

    for (let i = 0; i < idsToFollow.length; i += 1) {
      const current = idsToFollow[i];

      await this.requestToCreateOrgFollowHistory(whoActs, current);
    }

    for (let i = 0; i < idsToUnfollow.length; i += 1) {
      const current = idsToUnfollow[i];

      await this.requestToCreateOrgUnfollowHistory(whoActs, current);
    }
  }

  static async requestToCreateFollowHistory(whoActs, targetUser) {
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
  }

  static async requestToCreateUnfollowHistory(whoActs, targetUser) {
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
    await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);
  }

  static async requestToCreateOrgFollowHistory(whoActs, targetOrgId) {
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
    await this.requestToFollowOrganization(targetOrgId, whoActs);
  }

  static async requestToCreateOrgUnfollowHistory(whoActs, targetOrgId) {
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
      .post(requestHelper.getOrgFollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static async requestToUnfollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(requestHelper.getOrgUnfollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
      .post(requestHelper.getUnfollowUrl(targetUser.id))
      .set('Authorization', `Bearer ${whoActs.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  // noinspection JSUnusedGlobalSymbols
  static async createJoin(userJoined, postIdTo) {

    const res = await request(server)
      .post(requestHelper.getJoinUrl(postIdTo))
      .set('Authorization', `Bearer ${userJoined.token}`)
    ;

    responseHelper.expectStatusOk(res);
  }
}

export = ActivityHelper;
