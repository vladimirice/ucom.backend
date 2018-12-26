const express = require('express');
const TagsRouter  = express.Router();

const TagsFetchService    = require('../../lib/tags/service/tags-fetch-service.js');
const tagsApiMiddleware   = require('../../lib/tags/api/tag-api-middleware.js');

TagsRouter.get('/:tag_identity', async (req, res) => {
  const tagTitle = req.tag_identity;
  const dbTag = req.db_tag;
  const currentUserId = getCurrentUserId(req);

  const response = await TagsFetchService.findAndProcessOneTagById(dbTag, tagTitle, currentUserId);

  res.send(response);
});

TagsRouter.get('/:tag_identity/wall-feed', async (req, res) => {
  const query     = req.query;
  const tagTitle  = req.tag_identity;

  const response = await getPostService(req).findAndProcessAllForTagWallFeed(tagTitle, query);

  res.send(response);
});

TagsRouter.get('/:tag_identity/organizations', async (req, res) => {
  const query     = req.query;
  const tagTitle  = req.tag_identity;

  const response = await getOrganizationService(req).findAllByTagTitle(tagTitle, query);

  res.send(response);
});

TagsRouter.get('/:tag_identity/users', async (req, res) => {
  const query = req.query;
  const tagTitle = req.tag_identity;

  const response = await getUserService(req).findAllAndProcessForListByTagTitle(tagTitle, query);

  res.send(response);
});

TagsRouter.param('tag_identity', tagsApiMiddleware.tagIdentityParam);

/**
 *
 * @param {Object} req
 * @returns {number|null}
 */
function getCurrentUserId(req) {
  const service = req['container'].get('current-user');

  return service.getCurrentUserId();
}

/**
 *
 * @param {Object} req
 * @returns {UserService}
 */
function getUserService(req) {
  return req.container.get('user-service');
}

/**
 *
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req.container.get('post-service');
}

/**
 * @param {Object} req
 * @returns {OrganizationsService}
 */
function getOrganizationService(req) {
  return req['container'].get('organizations-service');
}

module.exports = TagsRouter;