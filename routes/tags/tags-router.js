"use strict";
const TagsFetchService = require("../../lib/tags/service/tags-fetch-service");
const TagApiMiddleware = require("../../lib/tags/api/tag-api-middleware");
const PostsFetchService = require("../../lib/posts/service/posts-fetch-service");
const QueryFilterService = require("../../lib/api/filters/query-filter-service");
const express = require('express');
const tagsRouter = express.Router();
/**
 *
 * @param {Object} req
 * @returns {number|null}
 */
function getCurrentUserId(req) {
    const service = req.container.get('current-user');
    return service.getCurrentUserId();
}
function getUserService(req) {
    return req.container.get('user-service');
}
function getOrganizationService(req) {
    return req.container.get('organizations-service');
}
tagsRouter.get('/:tag_identity', async (req, res) => {
    const tagTitle = req.tag_identity;
    const dbTag = req.db_tag;
    const currentUserId = getCurrentUserId(req);
    const response = await TagsFetchService.findAndProcessOneTagById(dbTag, tagTitle, currentUserId);
    res.send(response);
});
tagsRouter.get('/:tag_identity/wall-feed', async (req, res) => {
    const { query } = req;
    const tagTitle = req.tag_identity;
    const currentUserId = getCurrentUserId(req);
    QueryFilterService.checkLastIdExistence(query);
    const response = await PostsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, query);
    res.send(response);
});
tagsRouter.get('/:tag_identity/organizations', async (req, res) => {
    const { query } = req;
    const tagTitle = req.tag_identity;
    const response = await getOrganizationService(req).findAllByTagTitle(tagTitle, query);
    res.send(response);
});
tagsRouter.get('/:tag_identity/users', async (req, res) => {
    const { query } = req;
    const tagTitle = req.tag_identity;
    const response = await getUserService(req).findAllAndProcessForListByTagTitle(tagTitle, query);
    res.send(response);
});
tagsRouter.param('tag_identity', TagApiMiddleware.tagIdentityParam);
module.exports = tagsRouter;
