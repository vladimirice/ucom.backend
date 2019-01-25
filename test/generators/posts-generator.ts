import { UserModel } from '../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const _ = require('lodash');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
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
    const promises: any = [];

    for (let i = 0; i < mul; i += 1) {
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
    const promises: any = [];

    for (let i = 0; i < mul; i += 1) {
      promises.push(
        this.createMediaPostOfOrganization(orgAuthor, orgId),
      ); // User himself creates posts of organization
      promises.push(
        this.createPostOfferOfOrganization(orgAuthor, orgId),
      ); // User himself creates posts of organization
      promises.push(
        this.createDirectPostForOrganization(directPostAuthor, orgId, null, false, true),
      ); // Somebody creates direct post on organization wall
    }

    const postsIds = await Promise.all(promises);

    return postsIds.sort();
  }

  /**
   *
   * @param {Object} user
   * @param {number} orgId
   * @param {Object} values
   * @return {Promise<number>}
   */
  static async createMediaPostOfOrganization(
    user: UserModel,
    orgId: number,
    values: any = {},
  ): Promise<number> {
    const defaultValues = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      post_type_id: 1,
    };

    const newPostFields = _.defaults(values, defaultValues);

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields.title)
      .field('description', newPostFields.description)
      .field('post_type_id', newPostFields.post_type_id)
      .field('leading_text', newPostFields.leading_text)
      .field('organization_id', orgId);
    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} user
   * @param {number} orgId
   * @returns {Promise<number>}
   */
  static async createPostOfferOfOrganization(user, orgId) {
    const newPostFields = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      user_id: user.id,
      post_type_id: ContentTypeDictionary.getTypeOffer(),
      current_rate: '0.0000000000',
      current_vote: 0,
      action_button_title: 'TEST_BUTTON_CONTENT',
      organization_id: orgId,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields.title)
      .field('description', newPostFields.description)
      .field('leading_text', newPostFields.leading_text)
      .field('user_id', newPostFields.user_id)
      .field('post_type_id', newPostFields.post_type_id)
      .field('current_rate', newPostFields.current_rate)
      .field('current_vote', newPostFields.current_vote)
      .field('action_button_title', newPostFields.action_button_title)
      .field('organization_id', newPostFields.organization_id);
    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   * @param {Object} repostAuthor
   * @param {number} postId
   * @param {number} expectedStatus
   * @return {Promise<void>}
   *
   */
  static async createRepostOfUserPost(repostAuthor, postId, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getCreateRepostUrl(postId))
      .set('Authorization', `Bearer ${repostAuthor.token}`)
      .field('description', 'hello from such strange one');
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return +res.body.id;
  }

  static async createUserPostAndRepost(
    postAuthor,
    repostAuthor,
  ): Promise<{postId: number, repostId: number}> {
    const postId = await this.createMediaPostByUserHimself(postAuthor);
    const repostId = await this.createRepostOfUserPost(repostAuthor, postId);

    return {
      postId,
      repostId,
    };
  }

  /**
   *
   * @param {Object} postAuthor
   * @param {Object} repostAuthor
   * @return {Promise<{parentPostId: number, repostId: void}>}
   */
  static async createNewPostWithRepost(postAuthor, repostAuthor) {
    const parentPostId = await this.createMediaPostByUserHimself(postAuthor);
    const repostId = await this.createRepostOfUserPost(repostAuthor, parentPostId);

    return {
      parentPostId,
      repostId,
    };
  }

  static async createManyDefaultMediaPostsByUserHimself(
    user: any,
    amount: number,
  ) {
    const promises: any = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createMediaPostByUserHimself(user),
      );
    }

    return Promise.all(promises);
  }

  static async createManyMediaPostsOfOrganization(
    user: any,
    orgId: number,
    amount: number,
  ) {
    const promises: any = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createMediaPostOfOrganization(user, orgId),
      );
    }

    return Promise.all(promises);
  }

  /**
   *
   * @param {Object} user
   * @param {Object} values
   * @returns {Promise<number>}
   */
  static async createMediaPostByUserHimself(
    user: any,
    values: Object = {},
  ): Promise<number> {
    const defaultValues = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      post_type_id: ContentTypeDictionary.getTypeMediaPost(),
      user_id: user.id,
      current_rate: 0.0000000000,
      current_vote: 0,
    };

    const newPostFields = _.defaults(values, defaultValues);

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields.title)
      .field('description', newPostFields.description)
      .field('leading_text', newPostFields.leading_text)
      .field('post_type_id', newPostFields.post_type_id)
      .field('user_id', newPostFields.user_id)
      .field('current_rate', newPostFields.current_rate)
      .field('current_vote', newPostFields.current_vote);
    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   *
   * @param {Object} user
   * @return {Promise<number>}
   */
  static async createPostOfferByUserHimself(user) {
    const newPostFields = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      user_id: user.id,
      post_type_id: ContentTypeDictionary.getTypeOffer(),
      current_rate: '0.0000000000',
      current_vote: 0,
      action_button_title: 'TEST_BUTTON_CONTENT',
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields.title)
      .field('description', newPostFields.description)
      .field('leading_text', newPostFields.leading_text)
      .field('user_id', newPostFields.user_id)
      .field('post_type_id', newPostFields.post_type_id)
      .field('current_rate', newPostFields.current_rate)
      .field('current_vote', newPostFields.current_vote)
      .field('action_button_title', newPostFields.action_button_title);
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
   */
  static async createUserDirectPostForOtherUser(
    myself,
    wallOwner,
    givenDescription = null,
    withImage = false,
  ) {
    const url = RequestHelper.getUserDirectPostUrl(wallOwner);

    return this.createDirectPost(url, myself, givenDescription, withImage);
  }

  /**
   * @param {Object} myself
   * @param {Object} wallOwner
   * @param {string|null} givenDescription
   * @param {boolean} withImage
   * @return {Promise<void>}
   *
   */
  static async createUserDirectPostForOtherUserV2(
    myself,
    wallOwner,
    givenDescription = null,
    withImage = false,
  ) {
    const url = RequestHelper.getUserDirectPostUrlV2(wallOwner);

    return this.createDirectPost(url, myself, givenDescription, withImage);
  }

  /**
   * @param {Object} myself
   * @param {number} targetOrgId
   * @param {string|null} givenDescription
   * @param {boolean} withImage
   * @param {boolean} idOnly
   * @return {Promise<number>}
   *
   */
  static async createDirectPostForOrganization(
    myself,
    targetOrgId,
    givenDescription = null,
    withImage = false,
    idOnly = false,
  ) {
    const url = RequestHelper.getOrgDirectPostUrl(targetOrgId);

    return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
  }

  static async createDirectPostForOrganizationV2(
    myself,
    targetOrgId,
    givenDescription = null,
    withImage = false,
    idOnly = false,
  ) {
    const url = RequestHelper.getOrgDirectPostV2UrlV(targetOrgId);

    return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
  }

  static async createDirectPost(
    url,
    myself,
    givenDescription = null,
    withImage = false,
    idOnly = false,
  ) {
    const postTypeId = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const req = request(server)
      .post(url);
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

export = PostsGenerator;
