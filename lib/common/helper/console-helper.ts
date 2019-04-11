/* eslint-disable no-console */
import DatetimeHelper = require('./datetime-helper');

class ConsoleHelper {
  public static printIsStarted(processName: string): void {
    console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is started.`);
  }

  public static printIsFinished(processName: string, message: string = ''): void {
    console.log(`${DatetimeHelper.currentDatetime()}: ${processName} is finished. ${message}`);
  }
}

export = ConsoleHelper;
