const express = require('express');
const status  = require('statuses');
const multer  = require('multer');
require('express-async-errors');

const router  = express.Router();
const upload  = multer();

const authTokenMiddleWare   = require('../../lib/auth/auth-token-middleware');
const { cpUpload }          = require('../../lib/organizations/middleware/organization-create-edit-middleware');
const OrgIdParamMiddleware  = require('../../lib/organizations/middleware/organization-id-param-middleware');
const UserActivityService   = require('../../lib/users/user-activity-service');
const ActivityUserToOrg    = require('../../lib/users/activity').UserToOrg;
const winston               = require('../../config/winston');

/* Get all organizations */
router.get('/', async (req, res) => {
  const response = await getOrganizationService(req).getAllForPreview();

  res.send(response);
});

/* Get one organization by ID */
router.get('/:organization_id', async (req, res) => {
  const targetId = req.organization_id;

  const model = await getOrganizationService(req).findOneByIdAndProcess(targetId);

  res.send(model);
});

/* Create new organization */
router.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const model = await getOrganizationService(req).processNewOrganizationCreation(req);

  return res.status(201).send({
      'id': model.id,
  });
});


/* GET one organization posts */
router.get('/:organization_id/posts', async function(req, res) {
  const orgId = req.organization_id;
  const response = await getPostService(req).findAllByOrganization(orgId);

  res.send(response);
});

/* Update organization */
router.patch('/:organization_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
  await getOrganizationService(req).updateOrganization(req);

  return res.status(200).send({
    status: 'ok',
  });
});

/* One user follows organization */
router.post('/:organization_id/follow', [authTokenMiddleWare, upload.array() ], async function(req, res) {
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  winston.info(`Action - user follows organization. Request body is: ${JSON.stringify(req.body)}`);

  await ActivityUserToOrg.userFollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    'success': true,
  });
});

/* One user unfollows organization */
router.post('/:organization_id/unfollow', [authTokenMiddleWare, upload.array()], async function(req, res) {
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  winston.info(`Action - user UNfollows organization. Request body is: ${JSON.stringify(req.body)}`);

  await ActivityUserToOrg.userUnfollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    'success': true,
  });
});

router.param('organization_id', OrgIdParamMiddleware);

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

module.exports = router;