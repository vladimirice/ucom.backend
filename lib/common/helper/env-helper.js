"use strict";
const ENV__TEST = 'test';
const ENV__STAGING = 'staging';
const ENV__PRODUCTION = 'production';
class EnvHelper {
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
    static isExpectedEnv(env) {
        return process.env.NODE_ENV === env;
    }
    static isNotExpectedEnv(env) {
        return process.env.NODE_ENV !== env;
    }
}
module.exports = EnvHelper;
