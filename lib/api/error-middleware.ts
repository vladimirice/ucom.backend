import { AppError } from './errors';

const { ApiLogger } = require('../../config/winston');
const { BadRequestError } = require('../../lib/api/errors');

// noinspection JSUnusedLocalSymbols
// @ts-ignore
// eslint-disable-next-line
export = function (err, req, res, next) {
  // eslint-disable-next-line no-use-before-define
  const { status, payload } = processError(err);

  // eslint-disable-next-line no-param-reassign
  err.message += ` Request body is: ${JSON.stringify(req.body)}`;
  if (status === 500) {
    ApiLogger.error(err);
  } else {
    ApiLogger.warn(err);
  }

  res.status(status).send(payload);
};

/**
 *
 * @param {Object}err
 * @return {Object}
 * @private
 */
function processError(err: AppError) {
  // #task - this is because of registration error. err is got as string
  if (typeof err === 'string') {
    return {
      status: 500,
      payload: 'Internal server error',
    };
  }

  if (err instanceof BadRequestError) {
    return {
      status: err.status,
      payload: JSON.parse(err.message),
    };
  }

  if (err.status === 404) {
    return {
      status: err.status,
      payload: 'Not found',
    };
  }

  // eslint-disable-next-line no-param-reassign
  err.status = err.status || 500;

  if (err.status === 500) {
    return {
      status: 500,
      payload: 'Internal server error',
    };
  }

  return {
    status: err.status,
    payload: {
      errors: err.message,
    },
  };
}
