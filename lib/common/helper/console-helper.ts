/* eslint-disable no-console */
import { WorkerLogger } from '../../../config/winston';

import DatetimeHelper = require('./datetime-helper');

class ConsoleHelper {
  public static printIsStarted(processName: string): void {
    console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is started.`);
  }

  public static printIsFinished(processName: string, message: string = ''): void {
    console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is finished. ${message}`);
  }

  public static logWorkerError(error): void {
    WorkerLogger.error(error);
    console.error(`An error is occurred: ${error.message}. See logs`);
  }
}

export = ConsoleHelper;
