const reqlib = require('app-root-path').require;

const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const PostRepository = require('../../../lib/posts/posts-repository');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');

const PostStatsRepository = reqlib('/lib/posts/stats/post-stats-repository');

const ContentTypeDictionary   = require('uos-app-transaction').ContentTypeDictionary;
const PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');


require('jest-expect-message');

class PostsHelper {

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
   */
  static checkDirectPostItself(post) {
    const toExclude = PostsModelProvider.getModel().getFieldsToExcludeFromDirectPost();
    ResponseHelper.expectFieldsDoesNotExist(post, toExclude); // check for not allowed fields

    const mustBeNotNull = PostsModelProvider.getModel().getDirectPostNotNullFields();
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
   *
   * @param {Object} user
   * @param {string|null} givenDescription
   * @return {Promise<void>}
   */
  static async requestToCreateDirectPost(user, givenDescription = null) {
    const postTypeId  = ContentTypeDictionary.getTypeDirectPost();
    const description = givenDescription || 'sample direct post description';

    const res = await request(server)
      .post(RequestHelper.getUserDirectPostUrl(user))
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
   * @returns {Promise<number>}
   */
  static async requestToCreatePostOffer(user) {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': user.id,
      'post_type_id': PostTypeDictionary.getTypeOffer(),
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

  static async requestSampleMediaPostChange(user, post_id) {
    const fieldsToChange = {
      'title': 'This is title to change',
      'description': 'Also necessary to change description',
      'leading_text': 'And leading text',
    };

    const res = await request(server)
      .patch(RequestHelper.getOnePostUrl(post_id))
      .set('Authorization', `Bearer ${user.token}`)
      .field('title',         fieldsToChange['title'])
      .field('description',   fieldsToChange['description'])
      .field('leading_text',  fieldsToChange['leading_text'])
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.post_id;
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
   * @deprecated
   * @see requestToGetManyPostsAsGuest - renaming
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetPostsAsGuest(queryString = null) {
    return await this.requestToGetManyPostsAsGuest(queryString);
  }

  /**
   *
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyPostsAsGuest(queryString = null) {

    let url = RequestHelper.getPostsUrl();

    if (queryString) {
      url+= '?' + queryString;
    }

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.data;
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