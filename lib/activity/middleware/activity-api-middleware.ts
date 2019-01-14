import { Request, Response } from 'express';
const { BadRequestError } = require('../../../lib/api/errors');
const { ApiLogger } = require('../../../config/winston');

const redisClient = require('../../common/client/redis-client');

const delay = require('delay');

const ACTIVITY_REDLOCK_TTL_SEC = 60;

class ActivityApiMiddleware {
  public static async redlockBeforeActivity(
    // @ts-ignore
    req: Request,
    // @ts-ignore
    res: Response,
    next: Function,
  ) {
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

      req.redlock_lock = lock;
      next();
    } catch (err) {
      let errorForNext = err;
      if (err.name === 'LockError') {
        errorForNext = new BadRequestError({
          general: 'You already have an action request. Please wait until it is finished.',
        });
      } else {
        err.message +=
          'There is an error related to REDIS. Lets continue without parallel action lock';
        ApiLogger.error(err);
      }

      next(errorForNext);
    }
  }

  public static async redlockAfterActivity(
    // @ts-ignore
    req: Request,
    // @ts-ignore
    res: Response,
    next: Function,
  ) {
    console.log('Lets handle redlock after activity. Lets wait before other handlers');
    await next();
    console.log('Lets handle unlock event');

    try {
      const currentUserId = req.current_user_id;

      if (!currentUserId) {
        throw new Error('It is not possible to use redlockForActivity without user token');
      }

      if (!req.redlock_lock) {
        throw new Error('There is no req.redlock_lock');
      }

      console.log('Lets release lock');
      await redisClient.actionRedlockUnlock(req.redlock_lock);
      console.log('lock is released');
    } catch (err) {
      err.message +=
        'There is an error related to REDIS. Lets continue without parallel action lock';
      ApiLogger.error(err);

      next(err);
    }
  }
}

export = ActivityApiMiddleware;
