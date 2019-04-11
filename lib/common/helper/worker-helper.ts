import { WorkerOptionsDto } from '../interfaces/options-dto';

import MeasurementHelper = require('./measurement-helper');
import ConsoleHelper = require('./console-helper');

class WorkerHelper {
  public static async process(toExecute: Function, options: WorkerOptionsDto): Promise<any> {
    const decorated = this.workerDecorator(toExecute, options);

    return decorated();
  }

  private static workerDecorator(toExecute: Function, options: WorkerOptionsDto): Function {
    return async (): Promise<any> => {
      try {
        const m = MeasurementHelper.startWithMessage(options.processName);

        const result = await toExecute.apply(
          this,
          // eslint-disable-next-line prefer-rest-params
          arguments,
        );

        m.printWithDurationChecking(options.processName, options.durationInSecondsToAlert);

        return result;
      } catch (error) {
        ConsoleHelper.logWorkerError(error);

        return null;
      }
    };
  }
}

export = WorkerHelper;
