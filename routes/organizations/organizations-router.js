const express = require('express');
const router = express.Router();
const {AppError, BadRequestError} = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
// const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const OrganisationsRepositories = require('../../lib/organizations/repository');

require('express-async-errors');

/* Get all organizations */
router.get('/', async (req, res) => {

  const service = getOrganizationService(req);

  const response = await getOrganizationService(req).getAllForPreview();

  res.send(response);

  // const result = await getOrganizationService(req).findAll(req.query);

  // res.send(result);
});

/* Get one organization by ID */
router.get('/:organization_id', async (req, res) => {
  const targetId = req['organization_id'];

  const model = await getOrganizationService(req).findOneByIdAndProcess(targetId);

  res.send(model);
});

/* Create new organization */
router.post('/', [authTokenMiddleWare], async (req, res) => {
  return res.status(201).send({
    status: 'ok',
  });


  // const postTypeId = parseInt(req.body['post_type_id']);
  // if (!postTypeId) {
  //   throw new BadRequestError({
  //     'post_type_id': 'Post Type Id must be a valid natural number'
  //   })
  // }
  //
  // let newPost;
  // switch (postTypeId) {
  //   case PostTypeDictionary.getTypeMediaPost():
  //     newPost = await PostService.createNewPost(req);
  //     break;
  //   case PostTypeDictionary.getTypeOffer():
  //     newPost = await PostOfferService.createNew(req);
  //     break;
  //   default:
  //     throw new BadRequestError({
  //       'post_type_id': 'Provided post type ID is not supported'
  //     });
  // }
  //
  // res.send({
  //   'id': newPost.id
  // });
});


/* Update organization */
router.patch('/:organization_id', [authTokenMiddleWare], async (req, res) => {
  return res.status(201).send({
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