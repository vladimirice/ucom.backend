"use strict";
const errors_1 = require("../../api/errors");
const ENV__TEST = 'test';
const ENV__STAGING = 'staging';
const ENV__PRODUCTION = 'production';
const envList = [
    ENV__TEST,
    ENV__STAGING,
    ENV__PRODUCTION,
];
class EnvHelper {
    static executeByEnvironment(executors) {
        const env = this.getNodeEnvOrException();
        const func = executors[env];
        if (!func) {
            throw new errors_1.AppError(`There is no executor for env: ${env}`);
        }
        func();
    }
    static testEnv() {
        return ENV__TEST;
    }
    static stagingEnv() {
        return ENV__STAGING;
    }
    static productionEnv() {
        return ENV__PRODUCTION;
    }
    static getPortOrException() {
        const port = process.env.PORT;
        if (!port) {
            throw new Error('There is no port argument inside process.env');
        }
        return +port;
    }
    static getNodeEnvOrException() {
        const env = this.getNodeEnv();
        if (!env) {
            throw new errors_1.AppError('There is no NODE_ENV but must be');
        }
        if (!envList.includes(env)) {
            throw new errors_1.AppError(`Unsupported env: ${env}`);
        }
        return env;
    }
    static getNodeEnv() {
        return process.env.NODE_ENV;
    }
    static isTestEnv() {
        return this.isExpectedEnv(ENV__TEST);
    }
    static isStagingEnv() {
        return this.isExpectedEnv(ENV__STAGING);
    }
    static isProductionEnv() {
        return this.isExpectedEnv(ENV__PRODUCTION);
    }
    static isNotTestEnv() {
        return this.isNotExpectedEnv(ENV__TEST);
    }
    static isNotAProductionEnv() {
        return this.isNotExpectedEnv(ENV__PRODUCTION);
    }
    static isExpectedEnv(env) {
        return process.env.NODE_ENV === env;
    }
    static isNotExpectedEnv(env) {
        return process.env.NODE_ENV !== env;
    }
}
module.exports = EnvHelper;
