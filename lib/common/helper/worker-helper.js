"use strict";
const MeasurementHelper = require("./measurement-helper");
const ConsoleHelper = require("./console-helper");
const CloseHandlersHelper = require("./close-handlers-helper");
class WorkerHelper {
    static async process(toExecute, options) {
        const decorated = this.workerDecorator(toExecute, options);
        return decorated();
    }
    static workerDecorator(toExecute, options) {
        return async () => {
            const m = MeasurementHelper.startWithMessage(options.processName);
            let totalResponse;
            try {
                totalResponse = await toExecute.apply(this, 
                // eslint-disable-next-line prefer-rest-params
                arguments);
            }
            catch (error) {
                ConsoleHelper.logWorkerError(error);
            }
            finally {
                await CloseHandlersHelper.closeSequelizeAndKnex();
            }
            m.printWithDurationChecking(options.processName, options.durationInSecondsToAlert, totalResponse);
        };
    }
}
module.exports = WorkerHelper;
