const request = require('supertest');
const server  = require('../../../app');

const ResponseHelper      = require('./response-helper');
const FileToUploadHelper  = require('./file-to-upload-helper');

const apiV1Prefix = '/api/v1';

const checkAccountRoute   = '/api/v1/auth/registration/validate-account-name';
const registrationRoute   = '/api/v1/auth/registration';
const postsUrl            = `${apiV1Prefix}/posts`;
const usersUrl            = `${apiV1Prefix}/users`;
const organizationsUrl    = `${apiV1Prefix}/organizations`;
const myselfUrl           = `${apiV1Prefix}/myself`;

const communityUrl        = `${apiV1Prefix}/community`;
const partnershipUrl      = `${apiV1Prefix}/partnership`;
const blockchainUrl       = `${apiV1Prefix}/blockchain`;

const tagsUrl             = `${apiV1Prefix}/tags`;

const myselfBlockchainTransactionsUrl       = `${myselfUrl}/blockchain/transactions`;

class RequestHelper {

  /**
   *
   * @returns {string}
   */
  static getTagsRootUrl() {
    return tagsUrl;
  }

  /**
   *
   * @param {string} tagTitle
   */
  static getTagsWallFeedUrl(tagTitle) {
    return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/wall-feed`;
  }

  /**
   *
   * @param {string} tagTitle
   */
  static getTagsOrgUrl(tagTitle) {
    return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/organizations`;
  }

  /**
   *
   * @param {string} tagTitle
   */
  static getTagsUsersUrl(tagTitle) {
    return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/users`;
  }

  /**
   *
   * @param {string} url
   * @param {boolean} getBodyOnly
   * @returns {Promise<*>}
   */
  static async makeGetRequestForList(url, getBodyOnly = true) {
    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectValidListResponse(res);

    return getBodyOnly ? res.body : res;
  }

  /**
   *
   * @return {string}
   */
  static getMyselfBlockchainTransactionsUrl() {
    return myselfBlockchainTransactionsUrl;
  }

  /**
   *
   * @return {string}
   */
  static getBlockchainNodesListUrl() {
    return `${blockchainUrl}/nodes`;
  }

  /**
   *
   * @param {number} postId
   * @return {string}
   */
  static getCreateRepostUrl(postId) {
    const onePostUrl = this.getOnePostUrl(postId);

    return `${onePostUrl}/repost`;
  }

  /**
   *
   * @param {Object} req
   * @param {Object} user
   */
  static addAuthToken(req, user) {
    req
      .set('Authorization', `Bearer ${user.token}`)
    ;
  }

  /**
   *
   * @param {string} url
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  static async makePostGuestRequestWithFields(url, fields) {
    const req = request(server)
      .post(url)
    ;

    this.addFieldsToRequest(req, fields);

    return await req;
  }

  /**
   *
   * @param {Object} req
   * @param {Object} fields
   */
  static addFieldsToRequest(req, fields) {
    for (const field in fields) {
      req.field(field, fields[field]);
    }
  }

  /**
   *
   * @param {Object} req
   * @param {string} field
   */
  static addSampleMainImageFilename(req, field = 'main_image_filename') {
    req
      .attach(field, FileToUploadHelper.getSampleFilePathToUpload())
    ;
  }

  /**
   *
   * @return {string}
   */
  static getMyselfUrl() {
    return myselfUrl;
  }

  /**
   *
   * @param {number} id
   * @return {string}
   */
  static getConfirmNotificationUrl(id) {
    return `${this.getMyselfNotificationsList()}/${id}/confirm`;
  }

  /**
   *
   * @param {number} id
   * @return {string}
   */
  static getMarkAsSeenNotificationUrl(id) {
    return `${this.getMyselfNotificationsList()}/${id}/seen`;
  }

  /**
   *
   * @param {number} id
   * @return {string}
   */
  static getDeclineNotificationUrl(id) {
    return `${this.getMyselfNotificationsList()}/${id}/decline`;
  }

  /**
   *
   * @param {number} id
   * @return {string}
   */
  static getPendingNotificationUrl(id) {
    return `${this.getMyselfNotificationsList()}/${id}/pending`;
  }
  /**
   *
   * @param {number} targetUserId
   * @return {string}
   */
  static getOneUserWallFeed(targetUserId) {
    return `${usersUrl}/${targetUserId}/wall-feed`;
  }

  /**
   *
   * @return {string}
   */
  static getMyselfNotificationsList() {
    return `${myselfUrl}/notifications`
  }

  /**
   *
   * @return {string}
   */
  static getMyselfNewsFeedUrl() {
    return `${myselfUrl}/news-feed`;
  }

  /**
   *
   * @param {number} targetOrgId
   * @return {string}
   */
  static getOneOrgWallFeed(targetOrgId) {
    return `${organizationsUrl}/${targetOrgId}/wall-feed/`;
  }

  /**
   *
   * @param {number} totalAmount
   * @param {number} perPage
   * @return {number}
   */
  static getLastPage(totalAmount, perPage) {
    return +Math.floor(totalAmount/perPage);
  }

  /**
   *
   * @param {number} page
   * @param {number} perPage
   * @returns {Promise<Object>}
   */
  static getPaginationQueryString(page, perPage) {
    let params = [];

    if (page) {
      params.push(`page=${page}`);
    }

    if (perPage) {
      params.push(`per_page=${perPage}`);
    }

    return '?' + params.join('&');
  }


  /**
   *
   * @param {string} query
   * @returns {string}
   */
  static getCommunitySearchUrl(query) {
    return `${communityUrl}/search?q=${query}`
  }

  /**
   *
   * @param {number} org_id
   * @return {string}
   */
  static getOrgFollowUrl(org_id) {
    return `${this.getOrganizationsUrl()}/${org_id}/follow`;
  }

  /**
   *
   * @param {number} org_id
   * @return {string}
   */
  static getOrgUnfollowUrl(org_id) {
    return `${this.getOrganizationsUrl()}/${org_id}/unfollow`;
  }

  /**
   *
   * @param {string} query
   * @returns {string}
   */
  static getPartnershipSearchUrl(query) {
    return `${partnershipUrl}/search?q=${query}`
  }

  /**
   *
   * @param {number} orgId
   * @return {string}
   */
  static getOrganizationsPostsUrl(orgId) {
    return `${apiV1Prefix}/organizations/${orgId}/posts`;
  }

  /**
   *
   * @param {number} userId
   * @return {string}
   */
  static getUserPostsUrl(userId) {
    return `/api/v1/users/${userId}/posts`;
  }

  /**
   *
   * @return {string}
   */
  static getBlockchainContentUniqidUrl() {
    return `${blockchainUrl}/content/uniqid`;
  }


  /**
   *
   * @return {string}
   */
  static getOrganizationsUrl() {
    return `${apiV1Prefix}/organizations`;
  }

  /**
   *
   * @param {number} id
   * @return {string}
   */
  static getOneOrganizationUrl(id) {
    return `${this.getOrganizationsUrl()}/${id}`;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestMyself(user) {
    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }


  /**
   * @deprecated
   * @see requestUserByIdAsGuest
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  static async requestUserById(userId) {
    const res = await request(server)
      .get(this.getUserUrl(userId))
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestUserByIdAsGuest(user) {
    const res = await request(server)
      .get(this.getUserUrl(user.id))
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {Object} userToRequest
   * @returns {Promise<Object>}
   */
  static async requestUserByIdAsMyself(myself, userToRequest) {
    const res = await request(server)
      .get(this.getUserUrl(userToRequest.id))
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  static getUserUrl(userId) {
    return `/api/v1/users/${userId}`;
  }

  static getFollowUrl(userId) {
    return `/api/v1/users/${userId}/follow`
  }

  static getUnfollowUrl(userId) {
    return `/api/v1/users/${userId}/unfollow`
  }

  static getJoinUrl(postId) {
    return `/api/v1/posts/${postId}/join`;
  }

  static getCheckAccountNameRoute() {
    return checkAccountRoute;
  }
  static getRegistrationRoute() {
    return registrationRoute;
  }

  static getPostsUrl() {
    return postsUrl;
  }

  /**
   *
   * @param {Object} user
   * @return {string}
   */
  static getUserDirectPostUrl(user) {
    return `${usersUrl}/${user.id}/posts`;
  }

  /**
   *
   * @param {number} orgId
   * @return {string}
   */
  static getOrgDirectPostUrl(orgId) {
    return `${organizationsUrl}/${orgId}/posts`;
  }

  static getUsersUrl() {
    return usersUrl;
  }

  /**
   *
   * @param {string} query
   * @returns {string}
   */
  static getUserSearchUrl(query) {
    return `${usersUrl}/search?q=${query}`
  }

  static getOnePostUrl(post_id) {
    return `${postsUrl}/${post_id}`;
  }

  /**
   *
   * @param {number} post_id
   * @returns {string}
   */
  static getCommentsUrl(post_id) {
    return `/api/v1/posts/${post_id}/comments`;
  }

  /**
   *
   * @param {number} post_id
   * @param {number} comment_id
   * @returns {string}
   */
  static getCommentOnCommentUrl(post_id, comment_id) {
    return `/api/v1/posts/${post_id}/comments/${comment_id}/comments`;
  }
}

module.exports = RequestHelper;