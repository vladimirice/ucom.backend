const express = require('express');
const router = express.Router();
const {AppError, BadRequestError} = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload } = require('../../lib/organizations/middleware/organization-create-edit-middleware');
const OrganisationsRepositories = require('../../lib/organizations/repository');

require('express-async-errors');

/* Get all organizations */
router.get('/', async (req, res) => {
  const response = await getOrganizationService(req).getAllForPreview();

  res.send(response);
});

/* Get one organization by ID */
router.get('/:organization_id', async (req, res) => {
  const targetId = req['organization_id'];

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


/* Update organization */
router.patch('/:organization_id', [authTokenMiddleWare, cpUpload], async (req, res) => {

  const model = await getOrganizationService(req).updateOrganization(req);



  return res.status(200).send({
    status: 'ok',
  });

  // const user_id = req['user'].id;
  // const post_id = req['post_id'];
  //
  // // Lets change file
  // const files = req['files'];
  // // noinspection OverlyComplexBooleanExpressionJS
  // if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
  //   req.body['main_image_filename'] = files['main_image_filename'][0].filename;
  // }
  //
  // const params = req.body;
  //
  // const updatedPost = await PostService.updateAuthorPost(post_id, user_id, params);
  //
  // res.send({
  //   'post_id': updatedPost.id
  // });
});

router.param('organization_id', (req, res, next, organization_id) => {
  const value = parseInt(organization_id);

  if (!value) {
    throw new BadRequestError({
      'organization_id': 'Organization ID must be a valid integer'
    })
  }

  OrganisationsRepositories.Main.getOrganizationModel().count({
    where: {
      id: value
    }
  }).then(count => {

    if (count === 0) {
      throw new AppError(`There is no organization with ID ${value}`, 404);
    }
    req['organization_id'] = value;

    next();

  }).catch(next);
});

/**
 * @param {Object} req
 * @returns {OrganizationsService}
 */
function getOrganizationService(req) {
  return req['container'].get('organizations-service');
}

module.exports = router;