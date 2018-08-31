const express = require('express');
const router = express.Router();
const {AppError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const ActivityUserUserRepository = require('../lib/activity/activity-user-user-repository');
const ActivityService = require('../lib/activity/activity-service');
const PostsService = require('../lib/posts/post-service');
const UserService = require('../lib/users/users-service');

/* GET users listing. */
router.get('/:user_id', async function(req, res, next) {
  const userId = parseInt(req.params.user_id);

  if (!userId) {
    return next(new AppError("User not found", 404));
  }

  const user = await UserService.getUserById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.send(user);
});

router.get('/', async function(req, res) {
  const users = await UserService.findAll();

  res.send(users);
});

router.get('/:user_id/posts', async function(req, res) {
  const userId = parseInt(req.params.user_id);

  if (!userId) {
    return res.status(400).send('User ID is not correct');
  }

  const posts = await PostsService.findAllByAuthor(userId);

  res.send(posts);
});

/* Create new user-user-activity */
router.post('/:user_id/follow', [authTokenMiddleWare], async function(req, res) {
  const userToId = parseInt(req.params.user_id);
  const userFrom = req['user'];

  await ActivityService.userFollowsUser(userFrom, userToId);

  res.send({
    'status': 'ok'
  });
});


module.exports = router;