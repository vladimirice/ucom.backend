"use strict";
const INCOME = 1;
const DEBT = 2;
class AccountTypesDictionary {
    static income() {
        return INCOME;
    }
    static debt() {
        return DEBT;
    }
}
module.exports = AccountTypesDictionary;
