const config = require('config');

const router = require('./comments-router');
const {AppError, BadRequestError} = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const { descriptionParser } = require('../../lib/posts/post-description-image-middleware');

const PostService = require('../../lib/posts/post-service');
const ActivityService = require('../../lib/activity/activity-service');
const PostRepository = require('../../lib/posts/posts-repository');

require('express-async-errors');

/* Get all posts */
router.get('/', async (req, res) => {
  const result = await getPostService(req).findAll(req.query);

  res.send(result);
});

/* Get post by ID */
router.get('/:post_id', async (req, res) => {
  const post = await getPostService(req).findOneByIdAndProcess(req['post_id']);

  res.send(post);
});

router.post('/:post_id/join', [authTokenMiddleWare], async (req, res) => {
  const userFrom = req['user'];
  const post_id = req['post_id'];

  await ActivityService.userJoinsPost(userFrom, post_id);

  res.send({
    post_id,
    'user_id': userFrom.id,
  });
});

router.post('/:post_id/upvote', [authTokenMiddleWare], async (req, res) => {
  const result = await getPostService(req).userUpvotesPost(req['user'], req['post_id']);

  return res.status(201).send(result);
});

router.post('/:post_id/downvote', [authTokenMiddleWare], async (req, res) => {
  const result = await getPostService(req).userDownvotesPost(req['user'], req['post_id']);

  return res.status(201).send(result);
});

/* Upload post picture (for description) */
router.post('/image', [descriptionParser], async (req, res) => {
  const filename = req['files']['image'][0].filename;
  const rootUrl = config.get('host')['root_url'];

  res.send({
    'files': [
      {
        "url": `${rootUrl}/upload/${filename}`
      }
    ]
  });
});

/* Create new post */
router.post('/', [ authTokenMiddleWare, cpUpload ], async (req, res) => {
  const newPost = await getPostService(req).processNewPostCreation(req);

  res.send({ 'id': newPost.id });
});

/* Update Post */
router.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const user_id = req['user'].id;
  const post_id = req['post_id'];

  // Lets change file
  const files = req['files'];
  // noinspection OverlyComplexBooleanExpressionJS
  if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
    req.body['main_image_filename'] = files['main_image_filename'][0].filename;
  }

  const params = req.body;

  const updatedPost = await PostService.updateAuthorPost(post_id, user_id, params);

  res.send({
    'post_id': updatedPost.id
  });
});

router.param('post_id', (req, res, next, post_id) => {
  const value = parseInt(post_id);

  if (!value) {
    throw new BadRequestError({
      'post_id': 'Post ID must be a valid integer'
    })
  }

  PostRepository.getModel().count({
    where: {
      id: value
    }
  }).then(count => {

    if (count === 0) {
      throw new AppError(`There is no post with ID ${value}`, 404);
    }
    req['post_id'] = value;

    next();

  }).catch(next);
});

/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req['container'].get('post-service');
}

module.exports = router;