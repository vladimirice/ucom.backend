const request = require('supertest');
const server = require('../../../app');
const ResponseHelper = require('./response-helper');


const checkAccountRoute = '/api/v1/auth/registration/validate-account-name';
const registrationRoute = '/api/v1/auth/registration';
const postsUrl          = '/api/v1/posts';
const usersUrl          = '/api/v1/users';
const myselfUrl          = '/api/v1/myself';

class RequestHelper {
  static getUserPostsUrl(userId) {
    return `/api/v1/users/${userId}/posts`;
  }


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
   *
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

  static getUserUrl(userId) {
    return `/api/v1/users/${userId}`;
  }

  static getFollowUrl(userId) {
    return `/api/v1/users/${userId}/follow`
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

  static async sendPatch(url, token, payload) {
    const res = await request(server)
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    ;

    expect(res.status).toBe(200);

    return res.body;
  }
}

module.exports = RequestHelper;