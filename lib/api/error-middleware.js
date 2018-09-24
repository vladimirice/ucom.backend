const winston = require('../../config/winston');
const {BadRequestError} = require('../../lib/api/errors');

module.exports = function (err, req, res, next)  {
  if (err instanceof BadRequestError) {
    res.status(400);
    return res.send(JSON.parse(err.message));
  }

  if (!err.status) {
    err.status = 500;
  }

  if (err.status === 500) {
    winston.error(err);
  }

  let response = {
    errors: err.status === 500 ? 'Internal server error' : err.message
  };

  if (err.errors) {

    if (err.status === 500) {
      response.errors = {
        'general': 'Internal server error'
      }
    } else {
      response.errors = err.errors;
    }
  }

  let status = err.status || 500;

  res.status(status);
  res.send(response);
};