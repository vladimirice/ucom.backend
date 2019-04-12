/* eslint-disable no-console */
import ConsoleHelper = require('./console-helper');
import { WorkerLogger } from '../../../config/winston';

class MeasurementHelper {
  private startPoint;

  public static startWithMessage(processName: string) {
    ConsoleHelper.printIsStarted(processName);

    return this.start();
  }

  public static start() {
    const m = new this();

    m.startPoint = process.hrtime();

    return m;
  }

  public durationInSeconds(): number {
    const endPoint = process.hrtime(this.startPoint);

    return endPoint[0] + endPoint[1] / 1000000000;
  }

  public printWithDurationChecking(processName: string, limitInSeconds: number): void {
    const duration = this.durationInSeconds();

    if (duration >= limitInSeconds) {
      WorkerLogger.error(`${processName} execution time is too much: ${duration} sec`);
    }

    ConsoleHelper.printIsFinished(processName, `Duration is: ${duration} seconds`);
  }

  public printIsFinishedAndDuration(message: string = 'Process is finished'): void {
    ConsoleHelper.printIsFinished(message);

    this.printDurationInSeconds();
  }

  public printDurationInSeconds(): void {
    const duration = this.durationInSeconds();

    console.log(`Duration is: ${duration} seconds.`);
  }
}

export = MeasurementHelper;
