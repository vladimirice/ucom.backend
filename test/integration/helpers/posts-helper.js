const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const PostRepository = require('../../../lib/posts/posts-repository');

const PostStatsRepository = require('../../../lib/posts/stats/post-stats-repository');

const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;
const PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

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
   * @param {number} post_id
   * @param {Object|null} fieldsToChange
   * @param {number} expectedStatus
   * @return {Promise<void>}
   */
  static async updatePostWithFields(post_id, user, fieldsToChange = null, expectedStatus = 200) {
    if (!fieldsToChange) {
      // noinspection AssignmentToFunctionParameterJS
      fieldsToChange = {
        'title': 'This is title to change',
        'description': 'Also necessary to change description',
        'leading_text': 'And leading text',
      };
    }

    const req = request(server)
      .patch(RequestHelper.getOnePostUrl(post_id))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in fieldsToChange) {
      req.field(field, fieldsToChange[field]);
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
   * @param {number} org_id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToCreateMediaPostOfOrganization(user, org_id, expectedStatus = 200) {
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

    return res.body;
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkPostItselfCommonFields(post, options) {
    this._checkWrongPostProcessingSmell(post);

    expect(post.post_type_id).toBeTruthy();

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

    if (model.main_image_filename) {
      expect(model.entity_images.article_title[0].url).toMatch(model.main_image_filename);
    }
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
        mustExist = PostsModelProvider.getModel().getMediaOrOfferPostMustExistFields();
        break;
      case 'full':
        mustExist = PostsModelProvider.getModel().getMediaPostFullFields();
        break;
      case 'notification':
        mustExist = PostsModelProvider.getModel().getFieldsRequiredForNotification();
        break;
      default:
        throw new Error(`Unsupported postProcessing option (or it is not set): ${options.postProcessing}`);
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
    // TODO - check users team normalization if one page options

    let mustExist;
    switch (options.postProcessing) {
      case 'list':
        mustExist = PostsModelProvider.getModel().getFieldsForPreview();
        break;
      case 'full':
        mustExist = PostsModelProvider.getModel().getMediaPostFullFields();
        break;
      default:
        throw new Error(`Unsupported postProcessing option (or it is not set): ${options.postProcessing}`);
    }

    ResponseHelper.expectFieldsAreExist(post, mustExist);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkDirectPostItself(post, options = {}) {
    const toExclude = PostsModelProvider.getModel().getFieldsToExcludeFromDirectPost();
    ResponseHelper.expectFieldsDoesNotExist(post, toExclude); // check for not allowed fields

    const mustBeNotNull = PostsModelProvider.getModel().getDirectPostNotNullFields();
    expect(post.main_image_filename).toBeDefined();

    if (options.postProcessing === 'notification') {
      const commentsCountIndex = mustBeNotNull.indexOf('comments_count');

      delete mustBeNotNull[commentsCountIndex];
    }

    ResponseHelper.expectFieldsAreNotNull(post, mustBeNotNull); // check for fields which must exist

    this._checkWrongPostProcessingSmell(post);
  }

  static async expectPostDbValues(post, expected) {
    const entity = await PostRepository.findOnlyPostItselfById(post.id);
    expect(entity).toBeDefined();
    expect(entity).not.toBeNull();

    expect(entity).toMatchObject(expected);
  }


  /**
   *
   * @param {Object} post
   * @private
   */
  static _checkWrongPostProcessingSmell(post) {
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
  static async requestToCreateDirectPostForOrganization(user, targetOrgId, givenDescription = null) {
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
   * @return {Promise<void>}
   */
  static async requestToUpdateDirectPost(postId, user, givenDescription) {
    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization',   `Bearer ${user.token}`)
      .field('description',   givenDescription)
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
   * @deprecated
   * @see PostsGenerator
   * @param {Object} user
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOffer(user) {
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
   * @deprecated
   * @see PostsGenerator
   *
   * @param {Object} user
   * @param {number} orgId
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOfferOfOrganization(user, orgId) {
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
   * @param {number} post_id
   * @param {number} commentsCount
   * @returns {Promise<void>}
   */
  static async setCommentCountDirectly(post_id, commentsCount) {
    await PostStatsRepository.getModel().update({
      'comments_count': commentsCount
    }, {
      where: {
        post_id
      }
    })

  }

  /**
   *
   * @param {string | null } queryString
   * @param {boolean} dataOnly
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyPostsAsGuest(queryString = null, dataOnly = true) {

    let url = RequestHelper.getPostsUrl();

    if (queryString) {
      url+= '?' + queryString;
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

  /**
   *
   * @param {Object} myself
   * @param {number} userId
   */
  static async requestToGetManyUserPostsAsMyself(myself, userId) {
    let url = RequestHelper.getUserPostsUrl(userId);

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
      url+= '?' + queryString;
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
   * @param {number} post_id
   * @param {Object} user
   * @param {number} expectedStatus
   * @returns {Promise<Object>}
   */
  static async requestToGetOnePostAsMyself(post_id, user, expectedStatus = 200) {
    const res = await request(server)
      .get(RequestHelper.getOnePostUrl(post_id))
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
    const boardToChange = teamUsers.map(user => {
      return {
        user_id: user.id
      }
    });

    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('post_users_team[0][id]', boardToChange[0]['user_id'])
      .field('post_users_team[1][id]', boardToChange[1]['user_id'])
    ;

    ResponseHelper.expectStatusOk(res);

    return res;
  }

  /**
   *
   * @param {Object} whoUpvote
   * @param {number} postId
   * @returns {Promise<void>}
   */
  static async requestToUpvotePost(whoUpvote, postId) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/upvote`)
      .set('Authorization', `Bearer ${whoUpvote.token}`)
    ;

    ResponseHelper.expectStatusCreated(res);

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

  /**
   *
   * @param {number} post_id
   * @returns {Promise<Object>}
   * @link PostsService#findOnePostByIdAndProcess
   */
  static async requestToGetOnePostAsGuest(post_id) {
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