"use strict";
const ENV__TEST = 'test';
class EnvHelper {
    static isTestEnv() {
        return this.isExpectedEnv(ENV__TEST);
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
