const express = require('express');
const router = express.Router();
const PostsRepository = require('../lib/posts/posts-repository');
const {AppError} = require('../lib/api/errors');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const {upload, cpUpload} = require('../lib/posts/post-edit-middleware');

router.get('/', async (req, res) => {
  const posts = await PostsRepository.findAllPosts();

  res.send(posts);
});

router.get('/:post_id', async (req, res, next) => {
  const postId = parseInt(req.params['post_id']);
  const post = await PostsRepository.findOneById(postId);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }
  res.send(post);
});

router.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
  if (req.files && req.files['main_image_filename'] && req.files['main_image_filename'][0] && req.files['main_image_filename'][0].filename) {
    req.body['main_image_filename'] = req.files['main_image_filename'][0].filename;
  }

  const newPost = await PostsRepository.createNewPost(req.body, req['user']);

  res.send(newPost);
});

router.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {

  const postId = parseInt(req.params['post_id']);
  const userId = req['user'].id;

  if (!postId) {
    res.status(400).send({
      'errors': {
        field: 'post_id',
        message: 'Provided post_id parameter is not a correct integer'
      }
    })
  }

  const post = await PostsRepository.findOneByIdAndAuthor(postId, userId);

  if (!post) {
    return res.status(404).send({
      'errors': {
        field: 'post entity',
        message: 'Post is not found'
      }
    })
  }

  // Lets change file
  const files = req['files'];
  if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
    req.body['main_image_filename'] = files['main_image_filename'][0].filename;
  }

  // TODO remove unused files
  // TODO avoid changing

  const parameters = req.body;

  parameters['id'] = post.id;
  parameters['user_id'] = req['user'].id;


  const updatedPost = await post.update(parameters);

  res.send(updatedPost);
});

module.exports = router;