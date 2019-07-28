"use strict";
/* eslint-disable no-console */
const winston_1 = require("../../../config/winston");
const ConsoleHelper = require("./console-helper");
class MeasurementHelper {
    static startWithMessage(processName) {
        ConsoleHelper.printIsStarted(processName);
        return this.start();
    }
    static start() {
        const m = new this();
        m.startPoint = process.hrtime();
        return m;
    }
    durationInSeconds() {
        const endPoint = process.hrtime(this.startPoint);
        return endPoint[0] + endPoint[1] / 1000000000;
    }
    printWithDurationChecking(processName, limitInSeconds, totalResponse = null) {
        const duration = this.durationInSeconds();
        if (duration >= limitInSeconds) {
            winston_1.WorkerLogger.error(`${processName} execution time is too much: ${duration} sec`);
        }
        ConsoleHelper.printIsFinished(processName, `Duration is: ${duration.toFixed(3)} seconds`);
        if (totalResponse !== null) {
            const total = totalResponse.totalProcessedCounter + totalResponse.totalSkippedCounter;
            console.log(`Total processed items amount is: ${total}. Performance is: ${(total / duration).toFixed(2)} item/sec`);
        }
    }
    printIsFinishedAndDuration(message = 'Process is finished') {
        ConsoleHelper.printIsFinished(message);
        this.printDurationInSeconds();
    }
    printDurationInSeconds() {
        const duration = this.durationInSeconds();
        console.log(`Duration is: ${duration} seconds.`);
    }
}
module.exports = MeasurementHelper;
