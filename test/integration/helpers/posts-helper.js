const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const PostRepository = require('../../../lib/posts/posts-repository');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');

require('jest-expect-message');

class PostsHelper {

  /**
   *
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async requestToCreateMediaPost(user) {
    const newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'post_type_id': PostTypeDictionary.getTypeMediaPost(),
      'user_id': user.id,
      'current_rate': 0.0000000000,
      'current_vote': 0,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .send(newPostFields)
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOffer(user) {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': user,
      'post_type_id': PostTypeDictionary.getTypeOffer(),
      'current_rate': '0.0000000000',
      'current_vote': 0,
      'action_button_title': 'TEST_BUTTON_CONTENT',
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .send(newPostFields)
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }


  /**
   *
   * @param {number} postId
   * @param {string }fieldToBeNull
   * @returns {Promise<void>}
   */
  static async makeFieldNull(postId, fieldToBeNull) {
    let toUpdate = {};
    toUpdate[fieldToBeNull] = null;

    await PostRepository.getModel().update(toUpdate,
      { where: { id: postId } }
    );
  }

  static validateDbEntity(expected, actual) {
    const checkIsExistOnly = {
      'created_at': true,
      'updated_at': true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (checkIsExistOnly[field]) {
        expect(expected).toBeDefined();
        continue;
      }

      expect(actual[field], `${field} values are not equal`).toEqual(expected[field]);
    }
  }

  static validatePatchResponse(res, expected) {
    const body = res.body;

    expect(body.post_id).toBeDefined();
    expect(body.post_id).toBe(expected.id);
  }

  /**
   *
   * @param {number} postId
   * @param {Object} myself
   * @returns {Promise<string|*|string|HTMLElement|BodyInit|ReadableStream>}
   */
  static async getPostByMyself(postId, myself) {
    const res = await request(server)
      .get(`${RequestHelper.getOnePostUrl(postId)}`)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    expect(res.status).toBe(200);

    return res.body;
  }

  /**
   *
   * @param {integer} post_id
   * @returns {Promise<Object>}
   */
  static async requestToPost(post_id) {
    const res = await request(server)
      .get(RequestHelper.getOnePostUrl(post_id))
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }


  /**
   *
   * @param {number} page
   * @param {number} perPage
   * @param {boolean} dataOnly
   * @returns {Promise<Object>}
   */
  static async requestAllPostsWithPagination(page, perPage, dataOnly = false) {
    let url = RequestHelper.getPostsUrl() + '?';

    let params = [];

    if (page) {
      params.push(`page=${page}`);
    }

    if (perPage) {
      params.push(`per_page=${perPage}`);
    }

    url += params.join('&');
    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  static validateResponseJson(actual, expected) {

    expect(actual.hasOwnProperty('title')).toBeTruthy();
    expect(actual.title).toBe(expected.title);

    const checkExistsOnly = {
      'created_at': true,
      'updated_at': true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (checkExistsOnly[field]) {
        expect(actual[field], `Field ${field} is not defined`).toBeDefined();
        continue;
      }

      if (expected[field] === null || expected[field] === undefined) {
        continue;
      }

      expect(expected[field]).toEqual(actual[field]);
    }
  }
}

module.exports = PostsHelper;