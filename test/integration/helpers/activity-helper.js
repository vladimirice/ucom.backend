const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const request = require('supertest');
const server = require('../../../app');

const delay = require('delay');

const UsersActivityRepository = require('../../../lib/users/repository').Activity;

class ActivityHelper {
  static async requestToCreateFollow(whoActs, targetUser, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getFollowUrl(targetUser.id))
      .set('Authorization', `Bearer ${whoActs.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} userFrom
   * @return {Promise<*>}
   */
  static async requestToWaitAndGetTransaction(userFrom) {
    let activity = null;

    while(!activity) {
      activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userFrom.id);
      await delay(200);
    }

    return activity;
  }

  /**
   *
   * @param {Object} whoActs
   * @param {Object[]} usersToFollow
   * @param {Object[]} usersToUnfollow
   * @return {Promise<void>}
   */
  static async requestToCreateFollowUnfollowHistoryOfUsers(whoActs, usersToFollow = [], usersToUnfollow = []) {

    let usersIdsToFollow    = [];
    let usersIdsToUnfollow  = [];

    for (let i = 0; i < usersToFollow.length; i++) {
      const user = usersToFollow[i];

      usersIdsToFollow.push(user.id);

      await this.requestToCreateFollowHistory(whoActs, user);
    }

    for (let i = 0; i < usersToUnfollow.length; i++) {
      const user = usersToUnfollow[i];

      usersIdsToUnfollow.push(user.id);

      await this.requestToCreateUnfollowHistory(whoActs, user);
    }

    // noinspection JSUnusedGlobalSymbols
    return {
      usersIdsToFollow,
      usersIdsToUnfollow
    }
  };

  /**
   *
   * @param {Object} whoActs
   * @param {number[]} idsToFollow
   * @param {number[]} idsToUnfollow
   * @return {Promise<void>}
   */
  static async requestToCreateFollowUnfollowHistoryOfOrgs(whoActs, idsToFollow = [], idsToUnfollow = []) {

    for (let i = 0; i < idsToFollow.length; i++) {
      const current = idsToFollow[i];

      await this.requestToCreateOrgFollowHistory(whoActs, current);
    }

    for (let i = 0; i < idsToUnfollow.length; i++) {
      const current = idsToUnfollow[i];

      await this.requestToCreateOrgUnfollowHistory(whoActs, current);
    }
  };

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
    await this.requestToUnfollowOrganization(targetOrgId, whoActs)
  }

  static async requestToFollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getOrgFollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static async requestToUnfollowOrganization(org_id, user, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getOrgUnfollowUrl(org_id))
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

  static async createJoin(userJoined, postIdTo) {

    const res = await request(server)
      .post(RequestHelper.getJoinUrl(postIdTo))
      .set('Authorization', `Bearer ${userJoined.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
  }
}

module.exports = ActivityHelper;