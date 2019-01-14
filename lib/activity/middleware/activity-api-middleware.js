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
        console.log('Lets handle redlock before activity');
        try {
            const currentUserId = req.current_user_id;
            if (!currentUserId) {
                throw new Error('It is not possible to use redlockForActivity without user token');
            }
            const lockKey = `user_activity_${currentUserId}`;
            const lock = await redisClient.actionRedlockLock(lockKey, ACTIVITY_REDLOCK_TTL_SEC);
            console.log(`Lock is here: Key is: ${lockKey}`);
            if (process.env.NODE_ENV === 'test') {
                // #ugly part in order to speed up autotests
                await delay(3000);
            }
            res.on('finish', async () => {
                await ActivityApiMiddleware.redlockAfterActivity(lock);
            });
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
    static async redlockAfterActivity(redlockLock) {
        console.log('Lets handle unlock event');
        try {
            console.log('Lets release lock');
            await redisClient.actionRedlockUnlock(redlockLock);
            console.log('lock is released');
        }
        catch (err) {
            err.message +=
                'There is an error related to REDIS. Lets continue without parallel action lock';
            ApiLogger.error(err);
        }
    }
}
module.exports = ActivityApiMiddleware;
