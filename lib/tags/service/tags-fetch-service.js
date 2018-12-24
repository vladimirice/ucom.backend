"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const postsFetchService = require('../../posts/service/posts-fetch-service');
const usersFetchService = require('../../users/service/users-fetch-service');
const organizationsFetchService = require('../../organizations/service/organizations-fetch-service');
const tagsRepository = require('../../tags/repository/tags-repository');
const moment = require('moment');
class TagsFetchService {
    /**
     *
     * @param {string} tagTitle
     * @param {number|null} currentUserId
     * @returns {Promise<Object>}
     */
    static findAndProcessOneTagById(tagTitle, currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            // #task - should be provided by frontend
            const wallFeedQuery = {
                page: 1,
                per_page: 10,
            };
            const relatedEntitiesQuery = {
                page: 1,
                per_page: 5,
                v2: true,
            };
            const [posts, users, orgs, tag] = yield Promise.all([
                postsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, wallFeedQuery),
                usersFetchService.findAllAndProcessForListByTagTitle(tagTitle, relatedEntitiesQuery, currentUserId),
                organizationsFetchService.findAndProcessAllByTagTitle(tagTitle, relatedEntitiesQuery),
                tagsRepository.findOneByTitle(tagTitle),
            ]);
            return {
                posts,
                users,
                orgs,
                id: tag.id,
                title: tag.title,
                created_at: moment(tag.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
                current_rate: 0,
            };
        });
    }
}
module.exports = TagsFetchService;
