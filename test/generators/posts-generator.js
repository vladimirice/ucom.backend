const RequestHelper   = require('../integration/helpers').Req;
const ResponseHelper  = require('../integration/helpers').Res;

const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;

const request = require('supertest');
const server  = require('../../app');
const _       = require('lodash');
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
      promises.push(this.createUserDirectPostForOtherUser(directPostAuthor, wallOwner));
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
      promises.push(this.createDirectPostForOrganization(orgAuthor, orgId, null, false, true)); // Somebody creates direct post on organization wall
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
   * @param {Object} repostAuthor
   * @param {number} postId
   * @param {number} expectedStatus
   * @return {Promise<void>}
   *
   * @link PostCreatorService#processRepostCreation
   */
  static async createRepostOfUserPost(repostAuthor, postId, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getCreateRepostUrl(postId))
      .set('Authorization', `Bearer ${repostAuthor.token}`)
    ;
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} postAuthor
   * @param {Object} repostAuthor
   * @return {Promise<{parentPostId: number, repostId: void}>}
   */
  static async createNewPostWithRepost(postAuthor, repostAuthor) {
    const parentPostId  = await this.createMediaPostByUserHimself(postAuthor);
    const repostId      = await this.createRepostOfUserPost(repostAuthor, parentPostId);

    return {
      parentPostId,
      repostId
    }
  }

  /**
   *
   * @param {Object} user
   * @param {Object} values
   * @returns {Promise<number>}
   */
  static async createMediaPostByUserHimself(user, values = {}) {
    const defaultValues = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'post_type_id': ContentTypeDictionary.getTypeMediaPost(),
      'user_id': user.id,
      'current_rate': 0.0000000000,
      'current_vote': 0,
    };

    const newPostFields = _.defaults(values, defaultValues);

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
   * @param {Object} myself
   * @param {Object} wallOwner
   * @param {string|null} givenDescription
   * @param {boolean} withImage
   * @return {Promise<void>}
   *
   * @link PostsService#processNewDirectPostCreationForUser
   */
  static async createUserDirectPostForOtherUser(myself, wallOwner, givenDescription = null, withImage = false) {
    const url = RequestHelper.getUserDirectPostUrl(wallOwner);

    return this._createDirectPost(url, myself, givenDescription, withImage);
  }

  /**
   * @param {Object} myself
   * @param {number} targetOrgId
   * @param {string|null} givenDescription
   * @param {boolean} withImage
   * @param {boolean} idOnly
   * @return {Promise<number>}
   *
   * @link PostsService#processNewDirectPostCreationForOrg
   */
  static async createDirectPostForOrganization(myself, targetOrgId, givenDescription = null, withImage = false, idOnly = false) {
    const url = RequestHelper.getOrgDirectPostUrl(targetOrgId);

    return this._createDirectPost(url, myself, givenDescription, withImage, idOnly);
  }

  /**
   * @param {string} url
   * @param {Object} myself
   * @param {string|null} givenDescription
   * @param {boolean} withImage
   * @param {boolean} idOnly
   * @return {Promise<void>}
   *
   * @link PostsService#processNewDirectPostCreationForUser
   */
  static async _createDirectPost(url, myself, givenDescription = null, withImage = false, idOnly = false) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const req = request(server)
      .post(url)
    ;

    const fields = {
      description,
      post_type_id: postTypeId,
    };

    RequestHelper.addAuthToken(req, myself);
    RequestHelper.addFieldsToRequest(req, fields);

    if (withImage) {
      RequestHelper.addSampleMainImageFilename(req);
    }

    const res = await req;

    ResponseHelper.expectStatusOk(res);

    if (idOnly) {
      return res.body.id;
    }

    return res.body;
  }
}

module.exports = PostsGenerator;