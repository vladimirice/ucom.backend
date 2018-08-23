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

module.exports = router;