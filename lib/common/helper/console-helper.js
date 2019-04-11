"use strict";
/* eslint-disable no-console */
const DatetimeHelper = require("./datetime-helper");
class ConsoleHelper {
    static printIsStarted(processName) {
        console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is started.`);
    }
    static printIsFinished(processName, message = '') {
        console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is finished. ${message}`);
    }
}
module.exports = ConsoleHelper;
