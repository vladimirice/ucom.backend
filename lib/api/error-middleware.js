const winston = require('../../config/winston');
const {BadRequestError} = require('../../lib/api/errors');

module.exports = function (err, req, res, next)  {
  winston.error(err);

  if (err instanceof BadRequestError) {
    res.status(400);
    return res.send(JSON.parse(err.message));
  }

  let response = {
    error: err.message
  };
  if (err.errors) {
    response.errors = err.errors;
    if (!err.status) err.status = 400; // correct validation
  }
  let status = err.status || 500;

  res.status(status);
  res.send(response);
};