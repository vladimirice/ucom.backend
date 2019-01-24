import {UserModel} from "../../../lib/users/interfaces/model-interfaces";

const request = require('supertest');
const server = require('../../../app');
const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');
const postRepository = require('../../../lib/posts/posts-repository');

const postStatsRepository = require('../../../lib/posts/stats/post-stats-repository');

const contentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;
const postsModelProvider = require('../../../lib/posts/service/posts-model-provider');

require('jest-expect-message');

class PostsHelper {

  /**
   *
   * @param {number} postId
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToPatchPostRepost(postId, user, expectedStatus = 200) {
    const res = await request(server)
      .patch(requestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'new repost description')
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
      .patch(requestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in toChange) {
      req.field(field, toChange[field]);
    }

    const res = await req;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
      .post(requestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('post_type_id', newPostFields['post_type_id'])
      .field('leading_text', newPostFields['leading_text'])
      .field('organization_id', orgId)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkPostItselfCommonFields(post, options) {
    this.checkWrongPostProcessingSmell(post);

    expect(post.post_type_id).toBeTruthy();

    switch (post.post_type_id) {
      case contentTypeDictionary.getTypeMediaPost():
        this.checkMediaPostFields(post, options);
        break;
      case contentTypeDictionary.getTypeOffer():
        this.checkPostOfferFields(post, options);
        break;
      case contentTypeDictionary.getTypeDirectPost():
        this.checkDirectPostItself(post, options);
        break;
      case contentTypeDictionary.getTypeRepost():
        break;
      default:
        throw new Error(`Unsupported post_type_id ${post.post_type_id}`);
    }
  }

  /**
   *
   * @param {Object} model
   */
  static checkEntityImages(model) {
    expect(model.entity_images).toBeDefined();

    if (model.main_image_filename === null && model.entity_images === null) {

      return;
    }

    expect(model.entity_images.article_title).toBeDefined();
    expect(Array.isArray(model.entity_images.article_title)).toBeTruthy();
    expect(model.entity_images.article_title.length).toBe(1);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkMediaPostFields(post, options) {
    let mustExist;
    switch (options.postProcessing) {
      case 'list':
        mustExist = postsModelProvider.getModel().getMediaOrOfferPostMustExistFields();
        break;
      case 'full':
        mustExist = postsModelProvider.getModel().getMediaPostFullFields();
        break;
      case 'notification':
        mustExist = postsModelProvider.getModel().getFieldsRequiredForNotification();
        break;
      default:
        throw new Error(
          `Unsupported postProcessing option (or it is not set): ${options.postProcessing}`,
        );
    }

    responseHelper.expectFieldsAreExist(post, mustExist);

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

    responseHelper.expectFieldsAreExist(post, mustExist);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkDirectPostItself(post, options: any = {}) {
    const toExclude = postsModelProvider.getModel().getFieldsToExcludeFromDirectPost();
    responseHelper.expectFieldsDoesNotExist(post, toExclude); // check for not allowed fields

    const mustBeNotNull = postsModelProvider.getModel().getDirectPostNotNullFields();
    expect(post.main_image_filename).toBeDefined();

    if (options.postProcessing === 'notification') {
      const commentsCountIndex = mustBeNotNull.indexOf('comments_count');

      delete mustBeNotNull[commentsCountIndex];
    }

    responseHelper.expectFieldsAreNotNull(post, mustBeNotNull); // check for fields which must exist

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
    const postTypeId  = contentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(requestHelper.getUserDirectPostUrl(targetUser))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    responseHelper.expectStatusOk(res);

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
    const postTypeId  = contentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(requestHelper.getOrgDirectPostUrl(targetOrgId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
      .field('post_type_id',  postTypeId)
    ;

    responseHelper.expectStatusOk(res);

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
  static async requestToUpdatePostDescription(postId, user, givenDescription, tags = []) {
    let description = givenDescription || 'extremely updated one';

    tags.forEach((tag) => {
      description += ` #${tag} `;
    });

    const res = await request(server)
      .patch(requestHelper.getOnePostUrl(postId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
    ;

    responseHelper.expectStatusOk(res);

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
  static async requestToUpdatePostDescriptionV2(postId, user, givenDescription, tags = []) {
    let description = givenDescription || 'extremely updated one';

    tags.forEach((tag) => {
      description += ` #${tag} `;
    });

    const res = await request(server)
      .patch(requestHelper.getOnePostV2Url(postId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   description)
    ;

    responseHelper.expectStatusOk(res);

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
      post_type_id: contentTypeDictionary.getTypeMediaPost(),
      user_id: user.id,
      current_rate: 0.0000000000,
      current_vote: 0,
    };

    const res = await request(server)
      .post(requestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title',         newPostFields['title'])
      .field('description',   newPostFields['description'])
      .field('leading_text',  newPostFields['leading_text'])
      .field('post_type_id',  newPostFields['post_type_id'])
      .field('user_id',       newPostFields['user_id'])
      .field('current_rate',  newPostFields['current_rate'])
      .field('current_vote',  newPostFields['current_vote'])
    ;

    responseHelper.expectStatusOk(res);

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
      post_type_id: contentTypeDictionary.getTypeOffer(),
      current_rate: '0.0000000000',
      current_vote: 0,
      action_button_title: 'TEST_BUTTON_CONTENT',
    };

    const res = await request(server)
      .post(requestHelper.getPostsUrl())
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

    responseHelper.expectStatusOk(res);

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
      post_type_id: contentTypeDictionary.getTypeOffer(),
      current_rate: '0.0000000000',
      current_vote: 0,
      action_button_title: 'TEST_BUTTON_CONTENT',
      organization_id: orgId,
    };

    const res = await request(server)
      .post(requestHelper.getPostsUrl())
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

    responseHelper.expectStatusOk(res);

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
                                           { where: { id: postId } },
    );
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
    const body = res.body;

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
  static async requestToGetManyPostsAsGuest(queryString = null, dataOnly = true) {

    let url = requestHelper.getPostsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
    ;

    responseHelper.expectStatusOk(res);

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
    const url = requestHelper.getUserPostsUrl(userId);

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyPostsAsMyself(myself, queryString = null) {

    let url = requestHelper.getPostsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusOk(res);

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
      .get(`${requestHelper.getOnePostUrl(postId)}`)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    expect(res.status).toBe(200);

    return res.body;
  }

  /**
   *
   * @param {integer} postId
   * @returns {Promise<Object>}
   */
  static async requestToPost(postId) {
    const res = await request(server)
      .get(requestHelper.getOnePostUrl(postId))
    ;

    responseHelper.expectStatusOk(res);

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
      .get(requestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
    const boardToChange = teamUsers.map((user) => {
      return {
        user_id: user.id,
      };
    });

    const res = await request(server)
      .patch(requestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('post_users_team[0][id]', boardToChange[0]['user_id'])
      .field('post_users_team[1][id]', boardToChange[1]['user_id'])
    ;

    responseHelper.expectStatusOk(res);

    return res;
  }

  static async requestToUpvotePost(
    whoUpvote: any,
    postId: number,
    expectCreated:boolean = true,
  ) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/upvote`)
      .set('Authorization', `Bearer ${whoUpvote.token}`)
    ;

    if (expectCreated) {
      responseHelper.expectStatusCreated(res);
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

    responseHelper.expectStatusCreated(res);

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
      .get(requestHelper.getOnePostUrl(postId))
    ;

    responseHelper.expectStatusOk(res);

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
    let url = `${requestHelper.getPostsUrl()}?`;

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

    responseHelper.expectStatusOk(res);

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
