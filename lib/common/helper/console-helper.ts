/* eslint-disable no-console */
import { WorkerLogger } from '../../../config/winston';

import DatetimeHelper = require('./datetime-helper');

class ConsoleHelper {
  public static printApplicationIsStarted(port: number): void {
    console.log(`${DatetimeHelper.currentDatetime()}: application is started and is on the port: ${port}`);
  }

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
