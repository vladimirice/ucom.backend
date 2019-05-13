/* eslint-disable no-console */
import ConsoleHelper = require('./console-helper');
import { WorkerLogger } from '../../../config/winston';
import { TotalParametersResponse } from '../interfaces/response-interfaces';

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

  public printWithDurationChecking(
    processName: string,
    limitInSeconds: number,
    totalResponse: TotalParametersResponse | null = null,
  ): void {
    const duration = this.durationInSeconds();

    if (duration >= limitInSeconds) {
      WorkerLogger.error(`${processName} execution time is too much: ${duration} sec`);
    }

    ConsoleHelper.printIsFinished(processName, `Duration is: ${duration.toFixed(3)} seconds`);

    if (totalResponse !== null) {
      const total = totalResponse.totalProcessedCounter + totalResponse.totalSkippedCounter;

      console.log(`Total processed items amount is: ${total}. Performance is: ${(total / duration).toFixed(2)} item/sec`);
    }
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
