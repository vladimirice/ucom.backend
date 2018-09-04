const express = require('express');
const router = express.Router();
const {AppError, BadRequestError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const ActivityService = require('../lib/activity/activity-service');
const UserService = require('../lib/users/users-service');

/* Find users by name fields - shortcut */
router.get('/search', async (req, res) => {
  const query = req.query['q'];

  const users = UserService.findByNameFields(query);

  res.send(users);
});

/* GET users listing. */
router.get('/:user_id', async function(req, res) {
  const userId = req['user_id'];
  const user = await getUserService(req).getUserById(userId);

  res.send(user);
});

/* GET all users */
router.get('/', async function(req, res) {
  const users = await UserService.findAll();

  res.send(users);
});

/* GET all user posts */
router.get('/:user_id/posts', async function(req, res) {
  const userId = req['user_id'];
  const posts = await getPostService(req).findAllByAuthor(userId);

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

/**
 *
 * @param {Object} req
 * @returns {UserService}
 */
function getUserService(req) {
  return req['container'].get('user-service');
}

/**
 *
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req['container'].get('post-service');
}

module.exports = router;