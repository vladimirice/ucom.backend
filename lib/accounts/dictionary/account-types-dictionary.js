"use strict";
const INCOME = 1;
const DEBT = 2;
const RESERVED = 3;
const WAITING = 4;
const WALLET = 5;
class AccountTypesDictionary {
    static income() {
        return INCOME;
    }
    static debt() {
        return DEBT;
    }
    static reserved() {
        return RESERVED;
    }
    static waiting() {
        return WAITING;
    }
    static wallet() {
        return WALLET;
    }
}
module.exports = AccountTypesDictionary;
