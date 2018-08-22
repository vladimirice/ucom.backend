const express = require('express');
const router = express.Router();
const passport = require('passport');
const UsersValidator = require('../lib/validator/users-validator');
const _ = require('lodash');
const UsersRepository = require('../lib/users/users-repository');
const models = require('../models');

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

  const usersEducation = req.body['users_education'];
  const usersJobs = req.body['users_jobs'];

  let user = await UsersRepository.getUserById(req.user.id);

  if (usersEducation) {
    const educationDelta = getDelta(user.users_education, usersEducation);
    await updateRelations(user, educationDelta, 'users_education', parameters)
  }

  if (usersJobs) {
    const delta = getDelta(user.users_jobs, usersJobs);
    await updateRelations(user, delta, 'users_jobs')
  }

  // TODO update user in one transaction not in both

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

async function updateRelations(user, deltaData, modelName, userData) {
  await models.sequelize
    .transaction(async transaction => {

      // Update addresses
      await Promise.all([
        deltaData.added.map(async data => {

          data['user_id'] = user.id;

          let newModel = models[modelName].build(data);
          await newModel.save();
        }),
        deltaData.changed.map(async data => {
          const toUpdate = user[modelName].find(_data => _data.id === data.id);
          await toUpdate.update(data, { transaction });
        }),
        deltaData.deleted.map(async data => {
          await data.destroy({ transaction });
        })
      ]);

      if (userData) {
        return await user.update(userData, { transaction });
      }

      return true;
    })
}


function getDelta(source, updated) {
  const added = updated.filter(
    updatedItem => source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined
  );

  const changed = updated.filter(
    sourceItem => source.find(updatedItem => updatedItem.id === sourceItem.id) !== undefined
  );

  const deleted = source.filter(
    sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined
  );

  return {
    added,
    changed,
    deleted
  };
}

module.exports = router;