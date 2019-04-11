"use strict";
const MeasurementHelper = require("./measurement-helper");
const ConsoleHelper = require("./console-helper");
class WorkerHelper {
    static async process(toExecute, options) {
        const decorated = this.workerDecorator(toExecute, options);
        return decorated();
    }
    static workerDecorator(toExecute, options) {
        return async () => {
            try {
                const m = MeasurementHelper.startWithMessage(options.processName);
                const result = await toExecute.apply(this, 
                // eslint-disable-next-line prefer-rest-params
                arguments);
                m.printWithDurationChecking(options.processName, options.durationInSecondsToAlert);
                return result;
            }
            catch (error) {
                ConsoleHelper.logWorkerError(error);
                return null;
            }
        };
    }
}
module.exports = WorkerHelper;
