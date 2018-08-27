const express = require('express');
const router = express.Router();
let models = require('../models');
const {AppError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const PostsRepository = require('../lib/posts/posts-repository');

/* GET users listing. */
router.get('/:user_id', async function(req, res, next) {
  const userId = parseInt(req.params.user_id);
  const user = await UsersRepository.getUserById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.send(user);
});

router.get('/', async function(req, res) {
  const user = await models['Users'].findAll();
  res.send(user);
});

router.get('/:user_id/posts', async function(req, res) {
  const userId = parseInt(req.params.user_id);

  if (!userId) {
    return res.status(400).send('User ID is not correct');
  }

  const posts = await PostsRepository.findAllByAuthor(userId);

  res.send(posts);
});

module.exports = router;