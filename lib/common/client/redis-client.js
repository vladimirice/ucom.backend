"use strict";
const ioredis = require('ioredis');
const redlockLib = require('redlock');
const config = require('config');
const redisConfig = config.redis;
let mainDbClient = null;
let actionRedlock = null;
class RedisClient {
    static async getClient() {
        if (mainDbClient === null) {
            mainDbClient = new ioredis(redisConfig.port, redisConfig.host);
            await mainDbClient.select(redisConfig.main_db);
        }
        return mainDbClient;
    }
    static async actionRedlockLock(resource, ttlInSec) {
        const client = await this.getActionRedlock();
        return client.lock(resource, ttlInSec * 1000);
    }
    static async actionRedlockUnlock(lock) {
        await lock.unlock();
    }
    static async getActionRedlock() {
        const redisClient = await this.getClient();
        if (!actionRedlock) {
            actionRedlock = new redlockLib([redisClient], {
                // the expected clock drift; for more details
                // see http://redis.io/topics/distlock
                driftFactor: 0.01,
                // the max number of times Redlock will attempt
                // to lock a resource before error
                retryCount: 10,
                // the time in ms between attempts
                retryDelay: 200,
                // the max time in ms randomly added to retries
                // to improve performance under high contention
                // see https://www.awsarchitectureblog.com/2015/03/backoff.html
                retryJitter: 50,
            });
        }
        return actionRedlock;
    }
}
module.exports = RedisClient;
