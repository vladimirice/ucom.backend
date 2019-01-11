// tslint:disable-next-line:import-name
import RedlockType = require('redlock');

const ioredis     = require('ioredis');
const redlockLib  = require('redlock');

const config            = require('config');
const redisConfig: any  = config.redis;

let mainDbClient: any = null;
let actionRedlock: any = null;

class RedisClient {
  public static async getClient() {
    if (mainDbClient === null) {
      mainDbClient = new ioredis(redisConfig.port, redisConfig.host);
      await mainDbClient!.select(redisConfig.main_db);
    }

    return mainDbClient;
  }

  public static async actionRedlockLock(
    resource: string,
    ttlInSec: number,
  ): Promise<RedlockType.Lock> {
    const client = await this.getActionRedlock();

    return client.lock(resource, ttlInSec * 1000);
  }

  public static async actionRedlockUnlock(
    lock: RedlockType.Lock,
  ): Promise<void> {
    await lock.unlock();
  }

  private static async getActionRedlock(): Promise<RedlockType> {
    const redisClient = await this.getClient();

    if (!actionRedlock) {
      actionRedlock = new redlockLib(
        [redisClient],
        {
          // the expected clock drift; for more details
          // see http://redis.io/topics/distlock
          driftFactor: 0.01, // time in ms

          // the max number of times Redlock will attempt
          // to lock a resource before error
          retryCount:  10,

          // the time in ms between attempts
          retryDelay:  200, // time in ms

          // the max time in ms randomly added to retries
          // to improve performance under high contention
          // see https://www.awsarchitectureblog.com/2015/03/backoff.html
          retryJitter:  50, // time in ms
        },
      );
    }

    return actionRedlock;
  }
}

export = RedisClient;
