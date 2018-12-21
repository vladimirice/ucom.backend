const express = require('express');
const TagsRouter  = express.Router();

const TagsFetchService    = require('../../lib/tags/service/tags-fetch-service');
// const { BadRequestError } = require('../../lib/api/errors');

TagsRouter.get('/:tag_identity', async (req, res) => {
  const response = await TagsFetchService.findAndProcessOneTagById(req.tag_identity);

  res.send(response);
});

TagsRouter.get('/:tag_identity/wall-feed', async (req, res) => {
  const userId = 1; // TODO - mockup
  const query = req.query;

  const response = await getPostService(req).findAndProcessAllForUserWallFeed(userId, query);

  res.send(response);
});

TagsRouter.get('/:tag_identity/organizations', async (req, res) => {
  const query = req.query;

  const response = await getOrganizationService(req).getAllForPreview(query);

  res.send(response);
});

TagsRouter.get('/:tag_identity/users', async (req, res) => {
  const query = req.query;

  const response = await getUserService(req).findAllAndProcessForList(query);

  res.send(response);
});

TagsRouter.param('tag_identity', (req, res, next, incomingValue) => {
  // const value = parseInt(incomingValue);

  // if (!value) {
  //   throw new BadRequestError({
  //     'tag_id': 'Tag ID must be a valid integer'
  //   })
  // }

  // noinspection JSUndefinedPropertyAssignment
  req.tag_identity = incomingValue;

  next();

  // Check is tag exist and catch exceptions properly
  // TODO
});

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