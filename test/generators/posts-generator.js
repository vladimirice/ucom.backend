const RequestHelper   = require('../integration/helpers').Req;
const ResponseHelper  = require('../integration/helpers').Res;

const ContentTypeDictionary   = require('uos-app-transaction').ContentTypeDictionary;

const request = require('supertest');
const server = require('../../app');

class PostsGenerator {

  /**
   *
   * @param {Object} wallOwner
   * @param {Object} directPostAuthor
   * @param {number} mul
   * @return {Promise<number[]>}
   */
  static async generateUsersPostsForUserWall(wallOwner, directPostAuthor, mul = 1) {
    const promises = [];

    for (let i = 0; i < mul; i++) {
      promises.push(this.createMediaPostByUserHimself(wallOwner));
      promises.push(this.createPostOfferByUserHimself(wallOwner));
      promises.push(this.createDirectPostForOwnerWallByUser(directPostAuthor, wallOwner));

    }
    const postsIds = await Promise.all(promises);

    return postsIds.sort();
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} orgAuthor
   * @param {Object} directPostAuthor
   * @param {number} mul
   * @return {Promise<void>}
   */
  static async generateOrgPostsForWall(orgId, orgAuthor, directPostAuthor, mul = 1) {
    const promises = [];

    for (let i = 0; i < mul; i++) {
      promises.push(this.createMediaPostOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
      promises.push(this.createPostOfferOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
      promises.push(this.createDirectPostForOrganization(orgAuthor, orgId)); // Somebody creates direct post on organization wall
    }

    const postsIds = await Promise.all(promises);

    return postsIds.sort();
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

  /**
   *
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async createMediaPostByUserHimself(user) {
    const newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'post_type_id': ContentTypeDictionary.getTypeMediaPost(),
      'user_id': user.id,
      'current_rate': 0.0000000000,
      'current_vote': 0,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title',         newPostFields['title'])
      .field('description',   newPostFields['description'])
      .field('leading_text',  newPostFields['leading_text'])
      .field('post_type_id',  newPostFields['post_type_id'])
      .field('user_id',       newPostFields['user_id'])
      .field('current_rate',  newPostFields['current_rate'])
      .field('current_vote',  newPostFields['current_vote'])
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} user
   * @return {Promise<number>}
   */
  static async createPostOfferByUserHimself(user) {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': user.id,
      'post_type_id': ContentTypeDictionary.getTypeOffer(),
      'current_rate': '0.0000000000',
      'current_vote': 0,
      'action_button_title': 'TEST_BUTTON_CONTENT',
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
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   * @param {Object} postAuthor
   * @param {Object} wallOwner
   * @param {string|null} givenDescription
   * @return {Promise<void>}
   */
  static async createDirectPostForOwnerWallByUser(postAuthor, wallOwner, givenDescription = null) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(RequestHelper.getUserDirectPostUrl(wallOwner))
      .set('Authorization',   `Bearer ${postAuthor.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }
}

module.exports = PostsGenerator;