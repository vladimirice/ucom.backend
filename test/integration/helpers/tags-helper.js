const delay = require('delay');

const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');

const PostsRepository = require('../../../lib/posts/posts-repository');
const TagsRepository = require('../../../lib/tags/repository/tags-repository.js');
const entityTagsRepository = require('../../../lib/tags/repository/entity-tags-repository.js');
const entityStateLogRepository = require('../../../lib/entities/repository/entity-state-log-repository.js');

require('jest-expect-message');

class TagsHelper {

  /**
   * [Legacy]
   * @param {int} tagId
   * @param {number} expectedResponseStatus
   * @returns {Promise<*>}
   */
  static async requestToGetOneTagPageByIdAsGuest(tagId, expectedResponseStatus = 200) {
    const url = RequestHelper.getTagsRootUrl() + `/${tagId}`;

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusToBe(res, expectedResponseStatus);

    return res.body;
  }

  /**
   *
   * @param {string} tagTitle
   * @param {number} expectedResponseStatus
   * @returns {Promise<*>}
   */
  static async requestToGetOneTagPageByTitleAsGuest(tagTitle, expectedResponseStatus = 200) {
    const url = RequestHelper.getTagsRootUrl() + `/${tagTitle}`;

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusToBe(res, expectedResponseStatus);

    return res.body;
  }

  /**
   *
   * @param {number} modelId
   * @returns {Promise<Object>}
   */
  static async getPostWhenTagsAreProcessed(modelId) {
    let model;

    while(true) {
      model = await PostsRepository.findOnlyPostItselfById(modelId);

      if (model.entity_tags !== null) {
        break;
      }

      delay(100);
    }

    return model;
  }

  /**
   *
   * @param {string[]} expectedTags
   * @param {Object} model
   * @param {string} entityName
   * @returns {Promise<void>}
   */
  static async checkRelatedModels(expectedTags, model, entityName) {
    expect(model.entity_tags).toEqual(expectedTags);

    const [allTags, entityTags, entityStateLog] = await Promise.all([
      TagsRepository.getAllTags(),
      entityTagsRepository.findAllWithAllFieldsByEntity(model.id, entityName),
      entityStateLogRepository.findLastEntityStateLog(model.id, entityName)
    ]);

    const dbTags = [];

    expectedTags.forEach((tagTitle) => {
      const dbTag = allTags.find((tag) => tag.title === tagTitle);
      expect(dbTag, `There is no tag with title ${tagTitle}`).toBeTruthy();

      dbTags.push(dbTag);
    });

    dbTags.forEach((dbTag) => {
      const entityTag = entityTags.find((item) => +item.id === +dbTag.id);
      expect(entityTag, `There is no entity tag with id ${dbTag.id}`).toBeDefined();

      expect(entityTag.tag_title).toBe(dbTag.title);
    });

    expect(entityStateLog).toBeDefined();
    expect(entityStateLog).not.toBeNull();

    expect(+entityStateLog.entity_id).toBe(+model.id);
    expect(entityStateLog.entity_name).toBe(entityName);
    expect(JSON.stringify(entityStateLog.state_json).length).toBeGreaterThan(0);
  }
}

module.exports = TagsHelper;