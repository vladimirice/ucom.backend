import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';
import { NumberToNumberCollection } from '../../../lib/common/interfaces/common-types';

import EosImportance = require('../../../lib/eos/eos-importance');
import PostsRepository = require('../../../lib/posts/posts-repository');
import RequestHelper = require('./request-helper');
import ResponseHelper = require('./response-helper');
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');
import _ = require('lodash');
import PostsCurrentParamsRepository = require('../../../lib/posts/repository/posts-current-params-repository');
import knex = require('../../../config/knex');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
import EntityResponseState = require('../../../lib/common/dictionary/EntityResponseState');
import EntityImagesModelProvider = require('../../../lib/entity-images/service/entity-images-model-provider');

const request = require('supertest');
const { ContentTypeDictionary }   = require('ucom-libs-social-transactions');

const server = require('../../../app');
const postRepository = require('../../../lib/posts/posts-repository');

const postStatsRepository = require('../../../lib/posts/stats/post-stats-repository');


const postsModelProvider = require('../../../lib/posts/service/posts-model-provider');

require('jest-expect-message');

class PostsHelper {
  public static checkOneNewPostCurrentParams(data, isEmpty = false) {
    expect(_.isEmpty(data)).toBeFalsy();
    this.checkOneCurrentParamsRowStructure(data);
    if (isEmpty) {
      this.checkOneCurrentParamsRowFreshness(data);
    }
  }

  private static checkOneCurrentParamsRowStructure(data) {
    const expectedFields: string[] = [
      'created_at',
      'updated_at',
      'id',
      'post_id',
      'importance_delta',
      'activity_index_delta',
      'upvotes_delta',
    ];

    ResponseHelper.expectAllFieldsExistence(data, expectedFields);

    expect(typeof data.post_id).toBe('number');
    expect(typeof data.importance_delta).toBe('number');
    expect(typeof data.activity_index_delta).toBe('number');
    expect(typeof data.upvotes_delta).toBe('number');

    // #task
    // expect(typeof data.created_at).toBe('string');
    // expect(typeof data.updated_at).toBe('string');
  }

  private static checkOneCurrentParamsRowFreshness(data) {
    expect(data.importance_delta).toBe(0);
    expect(data.activity_index_delta).toBe(0);
    expect(data.upvotes_delta).toBe(0);
  }

  public static async setRandomRateToManyPosts(
    modelsIds: number[],
    processTags: boolean = true,
  ): Promise<NumberToNumberCollection> {
    const set: NumberToNumberCollection = {};
    for (let i = 0; i < <number>modelsIds.length; i += 1) {
      const modelId = modelsIds[i];
      set[modelId] = RequestHelper.generateRandomImportance();

      await PostsHelper.setSampleRateToPost(modelId, set[modelId]);
    }

    if (processTags) {
      await TagsCurrentRateProcessor.process();
    }

    return set;
  }

  static async setSampleRateToPost(
    postId: number,
    rateToSet: number = 0.1235,
  ): Promise<number> {
    await PostsRepository.setCurrentRateToPost(postId, rateToSet);

    const rateNormalized = EosImportance.getImportanceMultiplier() * rateToSet;

    return +rateNormalized.toFixed();
  }

  public static async changeOrganizationId(id: number, orgId: number): Promise<void> {
    await knex(PostsModelProvider.getTableName())
      .update({
        organization_id: orgId,
      })
      .where('id', '=', id)
    ;
  }

  public static async setSamplePositiveStatsParametersToPosts(
    entitiesIds: number[],
    orderedBy: string,
  ): Promise<any[]> {
    const entityIdToParams: any = [];

    const promises: Promise<any>[] = [];
    for (const id of entitiesIds) {
      const data = {
        post_id: id,
        importance_delta: RequestHelper.generateRandomNumber(1, 10, 10),
        activity_index_delta: RequestHelper.generateRandomNumber(1, 10, 4),
        upvotes_delta: RequestHelper.generateRandomNumber(1, 10, 0),
      };

      entityIdToParams.push(data);

      promises.push(
        PostsCurrentParamsRepository.updateValuesForEntity(id, data),
      );

      promises.push(
        this.setSampleRateToPost(id, RequestHelper.generateRandomImportance()),
      );
    }

    await Promise.all(promises);

    for (let i = 0; i < <number>entityIdToParams.length; i += 1) {
      const current = entityIdToParams[i];
      const dbPost = await PostsRepository.findOneByIdV2(current.post_id);

      current.user_id = dbPost.user_id;
      current.organization_id = dbPost.organization_id;
      current.current_rate = +dbPost.current_rate;
    }

    return _.orderBy(entityIdToParams, [orderedBy], ['desc']);
  }

  /**
   *
   * @param {number} postId
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToPatchPostRepost(postId, user, expectedStatus = 200) {
    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'new repost description')
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} user
   * @param {number} postId
   * @param {Object|null} fieldsToChange
   * @param {number} expectedStatus
   * @return {Promise<void>}
   */
  static async updatePostWithFields(
    postId,
    user,
    fieldsToChange: any = null,
    expectedStatus = 200,
  ) {
    const toChange = fieldsToChange || {
      title: 'This is title to change',
      description: 'Also necessary to change description',
      leading_text: 'And leading text',
    };

    const req = request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in toChange) {
      if (!toChange.hasOwnProperty(field)) {
        continue;
      }
      req.field(field, toChange[field]);
    }

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   * @deprecated
   * @see PostsGenerator
   *
   * @param {Object} user
   * @param {number} orgId
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToCreateMediaPostOfOrganization(user, orgId, expectedStatus = 200) {
    const newPostFields = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      post_type_id: 1,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields.title)
      .field('description', newPostFields.description)
      .field('post_type_id', newPostFields.post_type_id)
      .field('leading_text', newPostFields.leading_text)
      .field('organization_id', orgId)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static checkPostItselfCommonFields(
    post: PostModelResponse,
    options: CheckerOptions,
  ): void {
    this.checkWrongPostProcessingSmell(post);

    expect(post.post_type_id).toBeTruthy();
    expect(typeof post.entity_images).toBe('object');

    switch (post.post_type_id) {
      case ContentTypeDictionary.getTypeMediaPost():
        this.checkMediaPostFields(post, options);
        break;
      case ContentTypeDictionary.getTypeOffer():
        this.checkPostOfferFields(post, options);
        break;
      case ContentTypeDictionary.getTypeDirectPost():
        this.checkDirectPostItself(post, options);
        break;
      case ContentTypeDictionary.getTypeRepost():
        // #task - check repost itself fields
        break;
      default:
        throw new Error(`Unsupported post_type_id ${post.post_type_id}`);
    }
  }

  /**
   *
   * @param {Object} model
   */
  public static checkEntityImages(model: PostModelResponse) {
    const field: string = EntityImagesModelProvider.entityImagesColumn();

    ResponseHelper.expectToBeObject(model[field]);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkMediaPostFields(post, options) {
    let mustExist;
    switch (options.postProcessing) {
      case EntityResponseState.list():
        mustExist = postsModelProvider.getModel().getMediaOrOfferPostMustExistFields();
        break;
      case EntityResponseState.full():
        mustExist = postsModelProvider.getModel().getMediaPostFullFields();
        break;
      case EntityResponseState.notification():
        mustExist = postsModelProvider.getModel().getFieldsRequiredForNotification();
        break;
      case EntityResponseState.card():
        mustExist = PostsModelProvider.getPostsFieldsForCard();
        break;
      default:
        throw new Error(
          `Unsupported postProcessing option (or it is not set): ${options.postProcessing}`,
        );
    }

    ResponseHelper.expectFieldsAreExist(post, mustExist);

    this.checkEntityImages(post);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkPostOfferFields(post, options) {
    // #task - check users team normalization if one page options

    let mustExist;
    switch (options.postProcessing) {
      case 'list':
        mustExist = postsModelProvider.getModel().getFieldsForPreview();
        break;
      case 'full':
        mustExist = postsModelProvider.getModel().getMediaPostFullFields();
        break;
      default:
        throw new Error(
          `Unsupported postProcessing option (or it is not set): ${options.postProcessing}`,
        );
    }

    ResponseHelper.expectFieldsAreExist(post, mustExist);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkDirectPostItself(post, options: any = {}) {
    if (options.postProcessing === EntityResponseState.card()) {
      const expected = PostsModelProvider.getPostsFieldsForCard();
      ResponseHelper.expectFieldsAreExist(post, expected);
    } else {
      const toExclude = postsModelProvider.getModel().getFieldsToExcludeFromDirectPost();
      ResponseHelper.expectFieldsDoesNotExist(post, toExclude); // check for not allowed fields

      const mustBeNotNull = postsModelProvider.getModel().getDirectPostNotNullFields();
      expect(post.main_image_filename).toBeDefined();

      if (options.postProcessing === 'notification') {
        const commentsCountIndex = mustBeNotNull.indexOf('comments_count');

        delete mustBeNotNull[commentsCountIndex];
      }

      ResponseHelper.expectFieldsAreNotNull(post, mustBeNotNull); // check for fields which must exist
    }

    this.checkWrongPostProcessingSmell(post);
  }

  static async expectPostDbValues(post, expected) {
    const entity = await postRepository.findOnlyPostItselfById(post.id);
    expect(entity).toBeDefined();
    expect(entity).not.toBeNull();

    expect(entity).toMatchObject(expected);
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  private static checkWrongPostProcessingSmell(post) {
    // @ts-ignore
    expect(typeof post.current_rate, 'Probably post is not post-processed').not.toBe('string');
  }

  /**
   * @deprecated
   * @see PostsGenerator
   * @param {Object} user
   * @param {Object} targetUser
   * @param {string|null} givenDescription
   * @return {Promise<void>}
   */
  static async requestToCreateDirectPostForUser(user, targetUser, givenDescription = null) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(RequestHelper.getUserDirectPostUrl(targetUser))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   * @deprecated
   * @see PostsGenerator
   * @param {Object} user
   * @param {number} targetOrgId
   * @param {string|null} givenDescription
   * @return {Promise<void>}
   */
  static async requestToCreateDirectPostForOrganization(
    user,
    targetOrgId,
    givenDescription = null,
  ) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(RequestHelper.getOrgDirectPostUrl(targetOrgId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {number} postId
   * @param {Object} user
   * @param {string|null} givenDescription
   * @param {string[]} tags
   * @return {Promise<Object>}
   */
  static async requestToUpdatePostDescription(
    postId: number,
    user: UserModel,
    givenDescription: string | null,
    tags: string[] = [],
  ): Promise<any> {
    let description = givenDescription || 'extremely updated one';

    tags.forEach((tag) => {
      description += ` #${tag} `;
    });

    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  public static async requestToUpdatePostDescriptionV2(
    postId: number,
    user: UserModel,
    givenDescription: string,
    tags: string[] = [],
  ): Promise<PostModelResponse> {
    let description = givenDescription || 'extremely updated one';

    tags.forEach((tag) => {
      description += ` #${tag} `;
    });

    const res = await request(server)
      .patch(RequestHelper.getOnePostV2Url(postId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   * @deprecated
   * @see PostsGenerator
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async requestToCreateMediaPost(user) {
    const newPostFields = {
      title: 'Extremely new post',
      description: 'Our super post description',
      leading_text: 'extremely leading text',
      post_type_id: ContentTypeDictionary.getTypeMediaPost(),
      user_id: user.id,
      current_rate: 0,
      current_vote: 0,
    };

    const res = await request(server)
      .post(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title',         newPostFields.title)
      .field('description',   newPostFields.description)
      .field('leading_text',  newPostFields.leading_text)
      .field('post_type_id',  newPostFields.post_type_id)
      .field('user_id',       newPostFields.user_id)
      .field('current_rate',  newPostFields.current_rate)
      .field('current_vote',  newPostFields.current_vote)
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   * @deprecated
   * @see PostsGenerator
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOffer(user) {
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
      .field('title',               newPostFields.title)
      .field('description',         newPostFields.description)
      .field('leading_text',        newPostFields.leading_text)
      .field('user_id',             newPostFields.user_id)
      .field('post_type_id',        newPostFields.post_type_id)
      .field('current_rate',        newPostFields.current_rate)
      .field('current_vote',        newPostFields.current_vote)
      .field('action_button_title', newPostFields.action_button_title)
    ;

    ResponseHelper.expectStatusOk(res);

    return +res.body.id;
  }

  /**
   * @deprecated
   * @see PostsGenerator
   *
   * @param {Object} user
   * @param {number} orgId
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOfferOfOrganization(user, orgId) {
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
      .field('title',               newPostFields.title)
      .field('description',         newPostFields.description)
      .field('leading_text',        newPostFields.leading_text)
      .field('user_id',             newPostFields.user_id)
      .field('post_type_id',        newPostFields.post_type_id)
      .field('current_rate',        newPostFields.current_rate)
      .field('current_vote',        newPostFields.current_vote)
      .field('action_button_title', newPostFields.action_button_title)
      .field('organization_id',     newPostFields.organization_id)
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
    const toUpdate = {};
    toUpdate[fieldToBeNull] = null;

    await postRepository.getModel().update(toUpdate,
      { where: { id: postId } });
  }

  static validateDbEntity(expected, actual) {
    const checkIsExistOnly = {
      created_at: true,
      updated_at: true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (checkIsExistOnly[field]) {
        expect(expected).toBeDefined();
        continue;
      }

      // @ts-ignore
      expect(actual[field], `${field} values are not equal`).toEqual(expected[field]);
    }
  }

  static validatePatchResponse(res, expected) {
    const { body } = res;

    expect(body.post_id).toBeDefined();
    expect(body.post_id).toBe(expected.id);
  }

  /**
   *
   * @param {number} postId
   * @param {number} commentsCount
   * @returns {Promise<void>}
   */
  static async setCommentCountDirectly(postId, commentsCount) {
    await postStatsRepository.getModel().update({
      comments_count: commentsCount,
    },                                          {
      where: {
        post_id: postId,
      },
    });
  }

  /**
   *
   * @param {string | null } queryString
   * @param {boolean} dataOnly
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyPostsAsGuest(
    queryString: string | null = null,
    dataOnly: boolean = true,
  ): Promise<any> {
    let url = RequestHelper.getPostsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} myself
   * @param {number} userId
   */
  static async requestToGetManyUserPostsAsMyself(myself, userId) {
    const url = RequestHelper.getUserPostsUrl(userId);

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyPostsAsMyself(myself, queryString = null) {
    let url = RequestHelper.getPostsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.data;
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
   * @param {number} postId
   * @param {Object} user
   * @param {number} expectedStatus
   * @returns {Promise<Object>}
   */
  static async requestToGetOnePostAsMyself(
    postId: number,
    user: UserModel,
    expectedStatus: number = 200,
  ) {
    const res = await request(server)
      .get(RequestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      expect(res.body).toBeDefined();
      expect(res.body).not.toBeNull();
    }

    return res.body;
  }

  /**
   *
   * @param {number} postId
   * @param {Object} user
   * @param {Array} teamUsers - exactly two board members are allowed
   * @returns {Promise<Object>}
   */
  static async requestToSetPostTeam(postId, user, teamUsers) {
    const boardToChange = teamUsers.map(item => ({
      user_id: item.id,
    }));

    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('post_users_team[0][id]', boardToChange[0].user_id)
      .field('post_users_team[1][id]', boardToChange[1].user_id)
    ;

    ResponseHelper.expectStatusOk(res);

    return res;
  }

  static async requestToUpvotePost(
    whoUpvote: UserModel,
    postId: number,
    expectCreated:boolean = true,
  ) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/upvote`)
      .set('Authorization', `Bearer ${whoUpvote.token}`)
    ;

    if (expectCreated) {
      ResponseHelper.expectStatusCreated(res);
    }

    return res.body;
  }

  /**
   *
   * @param {Object} user
   * @param {number} postId
   * @returns {Promise<void>}
   */
  static async requestToDownvotePost(user, postId) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/downvote`)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  // noinspection JSValidateJSDoc
  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   * @link PostsService#findOnePostByIdAndProcess
   */
  static async requestToGetOnePostAsGuest(postId) {
    const res = await request(server)
      .get(RequestHelper.getOnePostUrl(postId))
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
    let url = `${RequestHelper.getPostsUrl()}?`;

    const params: string[] = [];

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

  // noinspection JSUnusedGlobalSymbols
  static validateResponseJson(actual, expected) {
    expect(actual.hasOwnProperty('title')).toBeTruthy();
    expect(actual.title).toBe(expected.title);

    const checkExistsOnly = {
      created_at: true,
      updated_at: true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (checkExistsOnly[field]) {
        // @ts-ignore
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

export = PostsHelper;
