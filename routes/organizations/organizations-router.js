const express = require('express');
const status  = require('statuses');
require('express-async-errors');

const OrgRouter  = express.Router();

const authTokenMiddleWare   = require('../../lib/auth/auth-token-middleware');
const { cpUpload, cpUploadArray }          = require('../../lib/organizations/middleware/organization-create-edit-middleware');
const OrgIdParamMiddleware  = require('../../lib/organizations/middleware/organization-id-param-middleware');
const ActivityUserToOrg    = require('../../lib/users/activity').UserToOrg;
const winston               = require('../../config/winston');

/* Get all organizations */
OrgRouter.get('/', async (req, res) => {
  const response = await getOrganizationService(req).getAllForPreview(req.query);

  res.send(response);
});

/* Get one organization by ID */
OrgRouter.get('/:organization_id', async (req, res) => {
  const targetId = req.organization_id;

  const model = await getOrganizationService(req).findOneOrgByIdAndProcess(targetId);

  res.send(model);
});

/* GET wall feed for user */
OrgRouter.get('/:organization_id/wall-feed', [ cpUploadArray ], async function(req, res) {
  const response = await getPostService(req).findAndProcessAllForOrgWallFeed(req.organization_id, req.query);

  res.send(response);
});

/* Create post for this organization */
OrgRouter.post('/:organization_id/posts', [authTokenMiddleWare, cpUploadArray], async function(req, res) {
  const response = await getPostService(req).processNewDirectPostCreationForOrg(req);

  res.send(response);
});

/* Create new organization */
OrgRouter.post('/', [ authTokenMiddleWare, cpUpload ], async (req, res) => {
  const model = await getOrganizationService(req).processNewOrganizationCreation(req);

  return res.status(201).send({
    'id': model.id,
  });
});


/* GET one organization posts */
OrgRouter.get('/:organization_id/posts', async function(req, res) {

  const orgId = req.organization_id;
  const response = await getPostService(req).findAndProcessAllForOrgWallFeed(orgId, req.query);

  res.send(response);
});

/* Update organization */
OrgRouter.patch('/:organization_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
  await getOrganizationService(req).updateOrganization(req);

  return res.status(200).send({
    status: 'ok',
  });
});

/* One user follows organization */
OrgRouter.post('/:organization_id/follow', [authTokenMiddleWare, cpUploadArray ], async function(req, res) {
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  winston.info(`Action - user follows organization. Request body is: ${JSON.stringify(req.body)}`);

  await ActivityUserToOrg.userFollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    'success': true,
  });
});

/* One user unfollows organization */
OrgRouter.post('/:organization_id/unfollow', [ authTokenMiddleWare, cpUploadArray ], async function(req, res) {
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  winston.info(`Action - user UNfollows organization. Request body is: ${JSON.stringify(req.body)}`);

  await ActivityUserToOrg.userUnfollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    'success': true,
  });
});

OrgRouter.param('organization_id', OrgIdParamMiddleware);

/**
 * @param {Object} req
 * @returns {OrganizationsService}
 */
function getOrganizationService(req) {
  return req['container'].get('organizations-service');
}

/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req['container'].get('post-service');
}

module.exports = OrgRouter;