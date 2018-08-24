const express = require('express');
const router = express.Router();
let models = require('../models');
const {AppError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const ActivityUserUserRepository = require('../lib/activity/activity-user-user-repository');

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

/* Create new user-user-activity */
router.post('/:user_id/follow', [authTokenMiddleWare], async function(req, res) {
  // TODO receive raw transaction and send it to blockchain
  const userToId = parseInt(req.params.user_id);
  const userTo = UsersRepository.getUserById(userToId);
  // TODO check is exists only
  // TODO check is follow already exists
  const userFrom = req['user'];

  if (!userTo) {
    return res.send({
      'errors': {
        'user_id': `There is no user with ID ${userToId}`
      }
    });
  }

  await ActivityUserUserRepository.createFollow(userFrom.id, userToId);


  // await ActivityUserUserRepository.getFollowActivityForUser(userVlad.id, userJane.id);

  res.send({
    'status': 'ok'
  });
});


module.exports = router;