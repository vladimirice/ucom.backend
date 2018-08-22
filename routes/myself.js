const express = require('express');
const router = express.Router();
const passport = require('passport');
const UsersValidator = require('../lib/validator/users-validator');
const _ = require('lodash');
const UsersRepository = require('../lib/users/users-repository');

const { cpUpload } = require('../lib/users/avatar-upload-middleware');

router.get('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  const user = await UsersRepository.getUserById(req.user.id);

  res.send(user)
});

router.patch('/', [passport.authenticate('jwt', {session: false}), cpUpload], async function(req, res, next) {
  const parameters = _.pick(req.body, UsersValidator.getFields());

  if (req.files && req.files['avatar_filename'] && req.files['avatar_filename'][0] && req.files['avatar_filename'][0].filename) {
    parameters['avatar_filename'] = req.files['avatar_filename'][0].filename;
  }

  let user = await UsersRepository.getUserById(req.user.id);


  user.users_education[0].title = 'Strange title';

  user.save().then((res) => {

  });


  req.user.getUsersEducation().then(associatedTasks => {
    const absdc= 0;
  });
  //
  //
  //
  // req.user.setUsersEducation[{
  //
  // }];


  req.user.validate()
    .then((res) => {
      return req.user.update({
        ...parameters
      });
    })
    .then(() => {
      return UsersRepository.getUserById(req.user.id);
    })
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      let errorResponse = [];

      err.errors.forEach((error) => {
        errorResponse.push({
          'field': error.path,
          'message': error.message,
        });
      });

      res.status(400).send({
        'errors': errorResponse
      });
    });
});

module.exports = router;