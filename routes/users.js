const express = require('express');
const router = express.Router();
let models = require('../models');
const {AppError} = require('../lib/api/errors');

/* GET users listing. */
router.get('/:user_id', async function(req, res, next) {
  const userId = parseInt(req.params.user_id);
  const user = await models.Users.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.send(user);
});

module.exports = router;
