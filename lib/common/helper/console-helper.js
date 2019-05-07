"use strict";
/* eslint-disable no-console */
const winston_1 = require("../../../config/winston");
const DatetimeHelper = require("./datetime-helper");
class ConsoleHelper {
    static printApplicationIsStarted(port) {
        console.log(`${DatetimeHelper.currentDatetime()}: application is started and is on the port: ${port}`);
    }
    static printIsStarted(processName) {
        console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is started.`);
    }
    static printIsFinished(processName, message = '') {
        console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is finished. ${message}`);
    }
    static logWorkerError(error) {
        winston_1.WorkerLogger.error(error);
        console.error(`An error is occurred: ${error.message}. See logs`);
    }
}
module.exports = ConsoleHelper;
