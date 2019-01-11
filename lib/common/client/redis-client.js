"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ioredis = require('ioredis');
const redlockLib = require('redlock');
const config = require('config');
const redisConfig = config.redis;
let mainDbClient = null;
let actionRedlock = null;
class RedisClient {
    static getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (mainDbClient === null) {
                mainDbClient = new ioredis(redisConfig.port, redisConfig.host);
                yield mainDbClient.select(redisConfig.main_db);
            }
            return mainDbClient;
        });
    }
    static actionRedlockLock(resource, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.getActionRedlock();
            return client.lock(resource, ttl);
        });
    }
    static actionRedlockUnlock(lock) {
        return __awaiter(this, void 0, void 0, function* () {
            yield lock.unlock();
        });
    }
    static getActionRedlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const redisClient = yield this.getClient();
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
        });
    }
}
module.exports = RedisClient;
