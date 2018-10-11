const RequestHelper   = require('../integration/helpers').Req;
const ResponseHelper  = require('../integration/helpers').Res;

const ContentTypeDictionary   = require('uos-app-transaction').ContentTypeDictionary;

const request = require('supertest');
const server = require('../../app');

class PostsGenerator {
  /**
   *
   * @param {number} orgId
   * @param {Object} orgAuthor
   * @param {Object} directPostAuthor
   * @return {Promise<void>}
   */
  static async generateOrgPostsForWall(orgId, orgAuthor, directPostAuthor) {
    const promisesToCreatePosts = [
      // User himself creates posts of organization
      this.createMediaPostOfOrganization(orgAuthor, orgId),
      this.createPostOfferOfOrganization(orgAuthor, orgId),

      // Somebody creates direct post on organization wall
      this.createDirectPostForOrganization(directPostAuthor, orgId),
    ];

    const [ mediaPostId, postOfferId, directPostId ] = await Promise.all(promisesToCreatePosts);

    return {
      mediaPostId,
      postOfferId,
      directPostId
    }
  }

  /**
   *
   * @param {Object} user
   * @param {number} org_id
   * @param {number} expectedStatus
   * @return {Promise<number>}
   */
  static async createMediaPostOfOrganization(user, org_id, expectedStatus = 200) {
    const newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'post_type_id': 1,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('post_type_id', newPostFields['post_type_id'])
      .field('leading_text', newPostFields['leading_text'])
      .field('organization_id', org_id)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} user
   * @param {number} orgId
   * @returns {Promise<number>}
   */
  static async createPostOfferOfOrganization(user, orgId) {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': user.id,
      'post_type_id': ContentTypeDictionary.getTypeOffer(),
      'current_rate': '0.0000000000',
      'current_vote': 0,
      'action_button_title': 'TEST_BUTTON_CONTENT',
      'organization_id': orgId,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title',               newPostFields['title'])
      .field('description',         newPostFields['description'])
      .field('leading_text',        newPostFields['leading_text'])
      .field('user_id',             newPostFields['user_id'])
      .field('post_type_id',        newPostFields['post_type_id'])
      .field('current_rate',        newPostFields['current_rate'])
      .field('current_vote',        newPostFields['current_vote'])
      .field('action_button_title', newPostFields['action_button_title'])
      .field('organization_id',     newPostFields['organization_id'])
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   * @param {Object} user
   * @param {number} targetOrgId
   * @param {string|null} givenDescription
   * @return {Promise<number>}
   */
  static async createDirectPostForOrganization(user, targetOrgId, givenDescription = null) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(RequestHelper.getOrgDirectPostUrl(targetOrgId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }
}

module.exports = PostsGenerator;