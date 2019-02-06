import { TagsModelResponse, TagsListResponse } from '../../../lib/tags/interfaces/dto-interfaces';

import ResponseHelper = require('./response-helper');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import RequestHelper = require('./request-helper');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const delay = require('delay');

const request = require('supertest');
const server = require('../../../app');

const postsRepository = require('../../../lib/posts/posts-repository');
const tagsRepository = require('../../../lib/tags/repository/tags-repository.js');
const entityTagsRepository = require('../../../lib/tags/repository/entity-tags-repository.js');
const entityStateLogRepository =
  require('../../../lib/entities/repository/entity-state-log-repository.js');

const postsModelProvider = require('../../../lib/posts/service/posts-model-provider.js');

require('jest-expect-message');

class TagsHelper {
  public static checkTagsListResponseStructure(response: TagsListResponse): void {
    ResponseHelper.expectValidListResponseStructure(response);
    this.checkManyTags(response.data);
  }

  public static async requestToGetOneTagPageByTitleAsMyself(
    tagTitle: string,
    myself: UserModel,
    expectedResponseStatus: number = 200,
  ): Promise<void> {
    const url = RequestHelper.getOneTagUrl(tagTitle);
    const req = request(server)
      .get(url)
    ;

    RequestHelper.addAuthToken(req, myself);

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedResponseStatus);

    return res.body;
  }

  /**
   *
   * @param {string} tagTitle
   * @param {number} expectedResponseStatus
   * @returns {Promise<Object>}
   */
  public static async requestToGetOneTagPageByTitleAsGuest(
    tagTitle: string,
    expectedResponseStatus: number = 200,
  ): Promise<Object> {
    const url = `${RequestHelper.getTagsRootUrl()}/${tagTitle}`;

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
  public static async getPostWhenTagsAreProcessed(modelId: number): Promise<any> {
    let model;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      model = await postsRepository.findOnlyPostItselfById(modelId);

      if (model.entity_tags !== null) {
        break;
      }

      delay(100);
    }

    return model;
  }

  /**
   *
   * @param {number} modelId
   * @param {string[]} expectedTags
   * @returns {Promise<Object>}
   */
  static async getPostWhenTagsAreUpdated(modelId: number, expectedTags: string[]) {
    let model;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      model = await postsRepository.findOnlyPostItselfById(modelId);

      if (model.entity_tags
        && JSON.stringify(model.entity_tags.sort()) === JSON.stringify(expectedTags.sort())
      ) {
        break;
      }

      delay(100);
    }

    return model;
  }

  /**
   *
   * @param {number} modelId
   * @param {string[]} expectedTags
   */
  static async checkRelatedPostModelsByPostId(modelId: number, expectedTags: string[]) {
    const model: any =
      await this.getPostWhenTagsAreUpdated(modelId, expectedTags);

    return this.checkRelatedPostModels(expectedTags, model);
  }

  /**
   *
   * @param {string[]} expectedTags
   * @param {Object} model
   * @returns {Promise<Object>}
   */
  static async checkRelatedPostModels(expectedTags: string[], model: Object) {
    const entityName = postsModelProvider.getEntityName();

    if (expectedTags.length > 0) {
      return this.checkRelatedModels(expectedTags, model, entityName);
    }

    return this.checkThereAreNoTags(model, entityName);
  }

  /**
   *
   * @param model
   * @param entityName
   */
  static async checkThereAreNoTags(model, entityName: string) {
    expect(model.entity_tags.length).toBe(0);

    const [allTags, entityTags, entityStateLog] = await Promise.all([
      tagsRepository.getAllTags(),
      entityTagsRepository.findAllWithAllFieldsByEntity(model.id, entityName),
      entityStateLogRepository.findLastEntityStateLog(model.id, entityName),
    ]);

    expect(entityTags.length).toBe(0);

    // Check entityStateLogRecords
    expect(entityStateLog).toBeDefined();
    expect(entityStateLog).not.toBeNull();

    expect(+entityStateLog.entity_id).toBe(+model.id);
    expect(entityStateLog.entity_name).toBe(entityName);
    expect(JSON.stringify(entityStateLog.state_json).length).toBeGreaterThan(0);

    return {
      allTags,
      entityTags,
      entityStateLog,
    };
  }

  static async getRelatedPostEntityTags(modelId: any): Promise<Object[]> {
    const entityName = postsModelProvider.getEntityName();

    return entityTagsRepository.findAllWithAllFieldsByEntity(modelId, entityName);
  }

  /**
   *
   * @param {string[]} expectedTags
   * @param {Object} model
   * @param {string} entityName
   * @returns {Promise<Object>}
   */
  static async checkRelatedModels(expectedTags, model, entityName) {
    expect(model.entity_tags.sort()).toEqual(expectedTags.sort());

    const [allTags, entityTags, entityStateLog] = await Promise.all([
      tagsRepository.getAllTags(),
      entityTagsRepository.findAllWithAllFieldsByEntity(model.id, entityName),
      entityStateLogRepository.findLastEntityStateLog(model.id, entityName),
    ]);

    entityTags.forEach((entityTag: any) => {
      expect(!!(~expectedTags.indexOf(entityTag.tag_title))).toBeTruthy();
    });

    const dbTags: Object[] = [];

    // Expect that all tagModels are created or exists in Db
    expectedTags.forEach((tagTitle) => {
      const dbTag: any = allTags.find((tag: any) => tag.title === tagTitle);
      expect(dbTag).toBeTruthy();

      dbTags.push(dbTag);
    });

    // Check entity_tags records related to model
    // Check that there are no deleted records

    dbTags.forEach((dbTag: any) => {
      const entityTag = entityTags.find((item: any) => +item.tag_id === +dbTag.id);
      expect(entityTag).toBeDefined();

      expect(entityTag.tag_title).toBe(dbTag.title);

      expect(entityTag.user_id).toBe(model.user_id);
      expect(entityTag.org_id).toBe(model.organization_id);
    });

    // Check entityStateLogRecords
    expect(entityStateLog).toBeDefined();
    expect(entityStateLog).not.toBeNull();

    expect(+entityStateLog.entity_id).toBe(+model.id);
    expect(entityStateLog.entity_name).toBe(entityName);
    expect(JSON.stringify(entityStateLog.state_json).length).toBeGreaterThan(0);

    return {
      allTags,
      dbTags,
      entityTags,
      entityStateLog,
    };
  }

  private static checkManyTags(data: TagsModelResponse[]): void {
    data.forEach((item) => {
      this.checkOneTag(item);
    });
  }

  private static checkOneTag(model: TagsModelResponse): void {
    const expected = TagsRepository.getTagPreviewFields();
    ResponseHelper.expectFieldsAreExist(model, expected);

    expect(model.entity_name).toBe(TagsModelProvider.getEntityName());

    ResponseHelper.checkCreatedAtUpdatedAtFormat(model);
  }
}

export = TagsHelper;
