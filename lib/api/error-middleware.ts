import { AppError } from './errors';

import EnvHelper = require('../common/helper/env-helper');

const { ApiLogger } = require('../../config/winston');
const { BadRequestError } = require('../../lib/api/errors');


/**
 *
 * @param {Object}err
 * @return {Object}
 * @private
 */
function processError(err: AppError) {
  // @ts-ignore
  if (err.name === 'MulterError' && ~['LIMIT_FILE_SIZE'].indexOf(err.code)) {
    return {
      status: 400,
      payload: {
        errors: err.message,
      },
    };
  }

  // #task - this is because of registration error. err is got as string
  // noinspection SuspiciousTypeOfGuard
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

export = (
  err,
  req,
  res,
  // @ts-ignore
  next,
) => {
  const { status, payload } = processError(err);

  if (typeof err !== 'string') {
    // eslint-disable-next-line no-param-reassign
    err.message += ` Request body is: ${JSON.stringify(req.body)}`;
  }

  if (status === 500) {
    ApiLogger.error(err);
  } else {
    ApiLogger.warn(err);
  }

  res.status(status).send(payload);

  if (status === 500 && EnvHelper.isNotTestEnv()) {
    // eslint-disable-next-line no-process-exit,unicorn/no-process-exit
    process.exit(1);
  }
};
