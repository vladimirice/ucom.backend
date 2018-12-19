const config = require('config');

const PostsRouter = require('./comments-router');
const {AppError, BadRequestError} = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const { descriptionParser } = require('../../lib/posts/post-description-image-middleware');

const PostService = require('../../lib/posts/post-service');
const PostRepository = require('../../lib/posts/posts-repository');

require('express-async-errors');

/* Get all posts */
PostsRouter.get('/', async (req, res) => {
  const result = await getPostService(req).findAll(req.query);

  res.send(result);
});

/* Get one post by ID */
PostsRouter.get('/:post_id', async (req, res) => {
  const PostService = getPostService(req);
  const postId      = req.post_id;

  const post = await PostService.findOnePostByIdAndProcess(postId);

  res.send(post);
});

PostsRouter.post('/:post_id/join', [authTokenMiddleWare, cpUpload], async (req, res) => {
  res.status(404).send('Action is disabled');
});

PostsRouter.post('/:post_id/upvote', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const result = await getPostService(req).userUpvotesPost(req['post_id'], req.body);

  return res.status(201).send(result);
});

PostsRouter.post('/:post_id/downvote', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const result = await getPostService(req).userDownvotesPost(req['post_id'], req.body);

  return res.status(201).send(result);
});

PostsRouter.post('/:post_id/repost', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const service = getPostService(req);
  const response = await service.processRepostCreation(req.body, req.post_id);

  res.status(201).send(response);
});

/* Upload post picture (for description) */
PostsRouter.post('/image', [descriptionParser], async (req, res) => {
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
PostsRouter.post('/', [ authTokenMiddleWare, cpUpload ], async (req, res) => {
  const newPost = await getPostService(req).processNewPostCreation(req);

  const response = PostService.isDirectPost(newPost) ? newPost : {
    id: newPost.id
  };

  res.send(response);
});

/* Update Post */
PostsRouter.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const user_id = req['user'].id;
  const post_id = req['post_id'];

  // Lets change file
  const files = req['files'];
  // noinspection OverlyComplexBooleanExpressionJS
  if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
    req.body['main_image_filename'] = files['main_image_filename'][0].filename;
  } else {
    // Not required to update main_image_filename if there is not uploaded file
    delete req.body.main_image_filename;
  }

  const params = req.body;

  const updatedPost = await getPostService(req).updateAuthorPost(post_id, user_id, params);

  if (PostService.isDirectPost(updatedPost)) {
    res.send(updatedPost);
  } else {
    res.send({
      'post_id': updatedPost.id
    });
  }
});

PostsRouter.param('post_id', (req, res, next, post_id) => {
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

module.exports = PostsRouter;