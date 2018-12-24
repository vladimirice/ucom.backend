"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const delay = require('delay');
const request = require('supertest');
const server = require('../../../app');
const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');
const postsRepository = require('../../../lib/posts/posts-repository');
const tagsRepository = require('../../../lib/tags/repository/tags-repository.js');
const entityTagsRepository = require('../../../lib/tags/repository/entity-tags-repository.js');
const entityStateLogRepository = require('../../../lib/entities/repository/entity-state-log-repository.js');
const postsModelProvider = require('../../../lib/posts/service/posts-model-provider.js');
require('jest-expect-message');
class TagsHelper {
    /**
     * [Legacy]
     * @param {int} tagId
     * @param {number} expectedResponseStatus
     * @returns {Promise<*>}
     */
    static requestToGetOneTagPageByIdAsGuest(tagId, expectedResponseStatus = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${requestHelper.getTagsRootUrl()}/${tagId}`;
            const res = yield request(server)
                .get(url);
            responseHelper.expectStatusToBe(res, expectedResponseStatus);
            return res.body;
        });
    }
    /**
     * @param {string} tagTitle
     * @param {Object} myself
     * @param {number} expectedResponseStatus
     * @returns {Promise<*>}
     */
    static requestToGetOneTagPageByTitleAsMyself(tagTitle, myself, expectedResponseStatus = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = requestHelper.getOneTagUrl(tagTitle);
            const req = request(server)
                .get(url);
            requestHelper.addAuthToken(req, myself);
            const res = yield req;
            responseHelper.expectStatusToBe(res, expectedResponseStatus);
            return res.body;
        });
    }
    /**
     *
     * @param {string} tagTitle
     * @param {number} expectedResponseStatus
     * @returns {Promise<Object>}
     */
    static requestToGetOneTagPageByTitleAsGuest(tagTitle, expectedResponseStatus = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${requestHelper.getTagsRootUrl()}/${tagTitle}`;
            const res = yield request(server)
                .get(url);
            responseHelper.expectStatusToBe(res, expectedResponseStatus);
            return res.body;
        });
    }
    /**
     *
     * @param {number} modelId
     * @returns {Promise<Object>}
     */
    static getPostWhenTagsAreProcessed(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            let model;
            while (true) {
                model = yield postsRepository.findOnlyPostItselfById(modelId);
                if (model.entity_tags !== null) {
                    break;
                }
                delay(100);
            }
            return model;
        });
    }
    /**
     *
     * @param {string[]} expectedTags
     * @param {Object} model
     * @returns {Promise<Object>}
     */
    static checkRelatedPostModels(expectedTags, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityName = postsModelProvider.getEntityName();
            return this.checkRelatedModels(expectedTags, model, entityName);
        });
    }
    /**
     *
     * @param {string[]} expectedTags
     * @param {Object} model
     * @param {string} entityName
     * @returns {Promise<Object>}
     */
    static checkRelatedModels(expectedTags, model, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            expect(model.entity_tags.sort()).toEqual(expectedTags.sort());
            const [allTags, entityTags, entityStateLog] = yield Promise.all([
                tagsRepository.getAllTags(),
                entityTagsRepository.findAllWithAllFieldsByEntity(model.id, entityName),
                entityStateLogRepository.findLastEntityStateLog(model.id, entityName),
            ]);
            const dbTags = [];
            // Expect that all tagModels are created or exists in Db
            expectedTags.forEach((tagTitle) => {
                const dbTag = allTags.find((tag) => tag.title === tagTitle);
                expect(dbTag).toBeTruthy();
                dbTags.push(dbTag);
            });
            // Check entity_tags records related to model
            dbTags.forEach((dbTag) => {
                const entityTag = entityTags.find((item) => +item.tag_id === +dbTag.id);
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
        });
    }
}
module.exports = TagsHelper;
