// eslint-disable-next-line no-unused-vars
import { Request, Response } from 'express';

const { BadRequestError } = require('../../../lib/api/errors');
const { ApiLogger } = require('../../../config/winston');

const redisClient = require('../../common/client/redis-client');

const ACTIVITY_REDLOCK_TTL_SEC = 60;

class ActivityApiMiddleware {
  public static async redlockBeforeActivity(
    // @ts-ignore
    req: Request,
    // @ts-ignore
    res: Response,
    next: Function,
  ) {
    try {
      // @ts-ignore
      const currentUserId = req.current_user_id;

      if (!currentUserId) {
        throw new Error('It is not possible to use redlockForActivity without user token');
      }

      const lockKey = `user_activity_${currentUserId}`;
      const lock = await redisClient.actionRedlockLock(lockKey, ACTIVITY_REDLOCK_TTL_SEC);

      res.on('finish', async () => {
        await ActivityApiMiddleware.redlockAfterActivity(lock);
      });

      next();
    } catch (err) {
      let errorForNext = err;
      console.log(JSON.stringify(err, null, 2));

      if (err.name === 'LockError') {
        errorForNext = new BadRequestError({
          general: 'You already have an action request. Please wait until it is finished.',
        });
      } else {
        err.message
          += 'There is an error related to REDIS. Lets continue without parallel action lock';
        ApiLogger.error(err);
      }

      next(errorForNext);
    }
  }

  private static async redlockAfterActivity(redlockLock) {
    try {
      await redisClient.actionRedlockUnlock(redlockLock);
    } catch (err) {
      err.message
        += 'There is an error related to REDIS. Lets continue without parallel action lock';
      ApiLogger.error(err);
    }
  }
}

export = ActivityApiMiddleware;
