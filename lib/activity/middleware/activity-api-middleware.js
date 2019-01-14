"use strict";
const { BadRequestError } = require('../../../lib/api/errors');
const { ApiLogger } = require('../../../config/winston');
const redisClient = require('../../common/client/redis-client');
const delay = require('delay');
const ACTIVITY_REDLOCK_TTL_SEC = 60;
class ActivityApiMiddleware {
    static async redlockBeforeActivity(
    // @ts-ignore
    req, 
    // @ts-ignore
    res, next) {
        try {
            const currentUserId = req.current_user_id;
            if (!currentUserId) {
                throw new Error('It is not possible to use redlockForActivity without user token');
            }
            const lock = await redisClient.actionRedlockLock(`user_activity_${currentUserId}`, ACTIVITY_REDLOCK_TTL_SEC);
            if (process.env.NODE_ENV === 'test') {
                // #ugly part in order to speed up autotests
                await delay(3000);
            }
            req.redlock_lock = lock;
            next();
        }
        catch (err) {
            let errorForNext = err;
            if (err.name === 'LockError') {
                errorForNext = new BadRequestError({
                    general: 'You already have an action request. Please wait until it is finished.',
                });
            }
            else {
                err.message +=
                    'There is an error related to REDIS. Lets continue without parallel action lock';
                ApiLogger.error(err);
            }
            next(errorForNext);
        }
    }
    static async redlockAfterActivity(
    // @ts-ignore
    req, 
    // @ts-ignore
    res, next) {
        await next();
        try {
            const currentUserId = req.current_user_id;
            if (!currentUserId) {
                throw new Error('It is not possible to use redlockForActivity without user token');
            }
            if (!req.redlock_lock) {
                throw new Error('There is no req.redlock_lock');
            }
            await redisClient.actionRedlockUnlock(req.redlock_lock);
        }
        catch (err) {
            err.message +=
                'There is an error related to REDIS. Lets continue without parallel action lock';
            ApiLogger.error(err);
            next(err);
        }
    }
}
module.exports = ActivityApiMiddleware;
