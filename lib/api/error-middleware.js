"use strict";
const { ApiLogger } = require('../../config/winston');
const { BadRequestError } = require('../../lib/api/errors');
/**
 *
 * @param {Object}err
 * @return {Object}
 * @private
 */
function processError(err) {
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
module.exports = function (err, req, res, next) {
    const { status, payload } = processError(err);
    err.message += ` Request body is: ${JSON.stringify(req.body)}`;
    if (status === 500) {
        ApiLogger.error(err);
    }
    else {
        ApiLogger.warn(err);
    }
    res.status(status).send(payload);
};
