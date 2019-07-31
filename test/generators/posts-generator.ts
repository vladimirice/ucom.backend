import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { PostModel, PostModelResponse } from '../../lib/posts/interfaces/model-interfaces';

import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');
import UsersHelper = require('../integration/helpers/users-helper');
import OrganizationsGenerator = require('./organizations-generator');
import EntityImagesModelProvider = require('../../lib/entity-images/service/entity-images-model-provider');
import PostsRepository = require('../../lib/posts/posts-repository');

const _ = require('lodash');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const request = require('supertest');

const server = RequestHelper.getApiApplication();

const entityImagesField: string = EntityImagesModelProvider.entityImagesColumn();

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
      .field('organization_id', orgId)
      .field('entity_images', '{}');
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
      .field('organization_id', newPostFields.organization_id)
      .field(EntityImagesModelProvider.entityImagesColumn(), '{}');
    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  public static async createRepostWithFields(
    myself: UserModel,
    postId: number,
    givenFields: any,
    expectedStatus: number = 201,
  ): Promise<PostModelResponse> {
    const url: string = RequestHelper.getCreateRepostUrl(postId);

    const fields = {
      ...givenFields,
      post_type_id: ContentTypeDictionary.getTypeRepost(),
    };

    if (typeof fields[entityImagesField] === 'object') {
      fields[entityImagesField] = JSON.stringify(fields[entityImagesField]);
    }

    const req = request(server)
      .post(url);

    RequestHelper.addAuthToken(req, myself);
    RequestHelper.addFieldsToRequest(req, fields);

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static async createRepostOfUserPost(
    repostAuthor: UserModel,
    postId: number,
    expectedStatus: number = 201,
  ): Promise<number> {
    const res = await request(server)
      .post(RequestHelper.getCreateRepostUrl(postId))
      .set('Authorization', `Bearer ${repostAuthor.token}`)
      .field('description', 'hello from such strange one');
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return +res.body.id;
  }

  static async createUserPostAndRepost(
    postAuthor: UserModel,
    repostAuthor: UserModel,
  ): Promise<{postId: number, repostId: number}> {
    const postId = await this.createMediaPostByUserHimself(postAuthor);
    const repostId = await this.createRepostOfUserPost(repostAuthor, postId);

    return {
      postId,
      repostId,
    };
  }

  public static async createUserDirectPostAndRepost(
    postAuthor: UserModel,
    wallOwner: UserModel,
    repostAuthor: UserModel,
  ): Promise<{postId: number, repostId: number}> {
    const postId  = await this.createDirectPostForUserAndGetId(postAuthor, wallOwner);
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

  public static async createManyDefaultMediaPostsByUserHimself(
    user: any,
    amount: number,
  ): Promise<number[]> {
    const promises: Promise<number>[] = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createMediaPostByUserHimself(user),
      );
    }

    return Promise.all(promises);
  }

  public static async createManyDefaultMediaPostsByDifferentUsers(
    amount: number,
  ): Promise<number[]> {
    const promises: Promise<number>[] = [];

    const users: UserModel[] = await UsersHelper.getAllSampleUsersFromDb();
    for (let i = 0; i < amount; i += 1) {
      const creatorIndex = RequestHelper.generateRandomNumber(0, users.length - 1, 0);

      if (i % 2 === 0) {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(users[creatorIndex]);
        promises.push(this.createMediaPostOfOrganization(users[creatorIndex], orgId));
      } else {
        promises.push(this.createMediaPostByUserHimself(users[creatorIndex]));
      }
    }

    return Promise.all(promises);
  }

  static async createManyMediaPostsOfOrganization(
    user: any,
    orgId: number,
    amount: number,
  ): Promise<number[]> {
    const promises: Promise<number>[] = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createMediaPostOfOrganization(user, orgId),
      );
    }

    return Promise.all(promises);
  }

  public static getSampleMediaPostFields(myself: UserModel) {
    return {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      post_type_id: ContentTypeDictionary.getTypeMediaPost(),
      user_id: myself.id,
      current_rate: 0,
      current_vote: 0,
      entity_images: '{}',
    };
  }

  public static async createMediaPostWithGivenFields(
    myself: UserModel,
    fields: any,
  ): Promise<number> {
    const url = RequestHelper.getPostsUrl();

    const response =
      await RequestHelper.makePostRequestAsMyselfWithFields(url, myself, fields);

    return +response.body.id;
  }

  public static async createMediaPostByUserHimselfAndGetModel(
    user: UserModel,
    values: any = {},
  ): Promise<PostModel> {
    const postId: number = await this.createMediaPostByUserHimself(user, values);

    return PostsRepository.findOnlyPostItselfById(postId);
  }

  public static async createMediaPostByUserHimself(
    user: UserModel,
    values: any = {},
  ): Promise<number> {
    const defaultValues = this.getSampleMediaPostFields(user);

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
      .field('current_vote', newPostFields.current_vote)
      .field('entity_images', newPostFields.entity_images);

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  public static async createPostOfferByUserHimself(user: UserModel): Promise<number> {
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
      .field('action_button_title', newPostFields.action_button_title)
      .field('entity_images', '{}');
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
    myself: UserModel,
    wallOwner: UserModel,
    givenDescription: string | null = null,
    withImage: boolean = false,
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

  public static async createManyDirectPostsForUserAndGetIds(
    myself: UserModel,
    wallOwner: UserModel,
    amount: number,
  ): Promise<number[]> {
    const promises: any[] = [];
    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createDirectPostForUserAndGetId(myself, wallOwner, null),
      );
    }

    return Promise.all(promises);
  }

  public static async createDirectPostForUserAndGetId(
    myself: UserModel,
    wallOwner: UserModel,
    givenDescription: string | null = null,
    withImage: boolean = false,
  ): Promise<number> {
    const url: string = RequestHelper.getUserDirectPostUrlV2(wallOwner);

    const body: PostModelResponse =
      await this.createDirectPost(url, myself, givenDescription, withImage);

    return body.id;
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
    myself: UserModel,
    targetOrgId: number,
    givenDescription: string | null = null,
    withImage: boolean = false,
    idOnly: boolean = false,
  ) {
    const url = RequestHelper.getOrgDirectPostUrl(targetOrgId);

    return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
  }

  static async createDirectPostForOrganizationV2(
    myself: UserModel,
    targetOrgId: number,
    givenDescription: string | null = null,
    withImage: boolean = false,
    idOnly: boolean = false,
  ): Promise<PostModelResponse> {
    const url = RequestHelper.getOrgDirectPostV2UrlV(targetOrgId);

    return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
  }

  public static async createDirectPostForOrganizationV2AndGetId(
    myself: UserModel,
    targetOrgId: number,
    givenDescription: string | null = null,
    withImage: boolean = false,
    idOnly: boolean = false,
  ): Promise<number> {
    const url = RequestHelper.getOrgDirectPostV2UrlV(targetOrgId);

    const data = await this.createDirectPost(url, myself, givenDescription, withImage, idOnly);

    return data.id;
  }

  public static async createManyDirectPostsForOrganization(
    myself: UserModel,
    orgId: number,
    amount: number,
  ): Promise<number[]> {
    const promises: any[] = [];
    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createDirectPostForOrganization(myself, orgId, null, true, true),
      );
    }

    return Promise.all(promises);
  }

  public static async createDirectPostForUserWithFields(
    myself: UserModel,
    wallOwner: UserModel,
    givenFields: any,
  ): Promise<PostModelResponse> {
    const url: string = RequestHelper.getUserDirectPostUrlV2(wallOwner);

    const fields = {
      [EntityImagesModelProvider.entityImagesColumn()]: '{}',
      ...givenFields,
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
    };

    if (typeof fields[entityImagesField] === 'object') {
      fields[entityImagesField] = JSON.stringify(fields[entityImagesField]);
    }

    const req = request(server)
      .post(url);

    RequestHelper.addAuthToken(req, myself);
    RequestHelper.addFieldsToRequest(req, fields);

    const res = await req;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  static async createDirectPost(
    url: string,
    myself: UserModel,
    givenDescription: string | null = null,
    // @ts-ignore
    withImage: boolean = false,
    idOnly: boolean = false,
  ): Promise<PostModelResponse> {
    const postTypeId = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const req = request(server)
      .post(url);
    const fields = {
      description,
      post_type_id: postTypeId,
      entity_images: '{}',
    };

    RequestHelper.addAuthToken(req, myself);
    RequestHelper.addFieldsToRequest(req, fields);

    const res = await req;

    ResponseHelper.expectStatusOk(res);

    if (idOnly) {
      return res.body.id;
    }

    return res.body;
  }
}

export = PostsGenerator;
