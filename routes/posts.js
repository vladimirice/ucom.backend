const express = require('express');
const router = express.Router();
const PostsRepository = require('../lib/posts/posts-repository');
const {AppError} = require('../lib/api/errors');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');

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


router.post('/', [authTokenMiddleWare], async (req, res) => {
  // TODO validate user input

  const newPost = await PostsRepository.createNewPost(req.body, req['user']);

  res.send(newPost);
});

module.exports = router;