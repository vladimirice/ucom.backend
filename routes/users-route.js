const express = require('express');
const router = express.Router();
const {AppError, BadRequestError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const ActivityService = require('../lib/activity/activity-service');
const PostsService = require('../lib/posts/post-service');
const UserService = require('../lib/users/users-service');
const CurrentUserMiddleware = require('../lib/auth/current-user-middleware');

/* GET users listing. */
router.get('/:user_id', [CurrentUserMiddleware], async function(req, res, next) {
  const userId = req['user_id'];

  const user = await UserService.getUserById(userId);

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
  const userFrom = req['user'];
  const userToId = req['user_id'];

  await ActivityService.userFollowsUser(userFrom, userToId);

  res.send({
    'user_id_from': userFrom.id,
    'user_id_to': userToId,
    'activity': 'follow'
  });
});

router.param('user_id', (req, res, next, incoming_id) => {
  const value = parseInt(incoming_id);

  if (!value) {
    throw new BadRequestError({
      'user_id': 'User ID must be a valid integer'
    })
  }

  UsersRepository.doesUserExistWithId(value)
  .then(doesExist => {

    if (!doesExist) {
      throw new AppError(`There is no user with ID ${value}`, 404);
    }
    req['user_id'] = value;

    next();

  }).catch(next);
});


module.exports = router;