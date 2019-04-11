import { WorkerOptionsDto } from '../interfaces/options-dto';

import MeasurementHelper = require('./measurement-helper');
import ConsoleHelper = require('./console-helper');
import CloseHandlersHelper = require('./close-handlers-helper');

class WorkerHelper {
  public static async process(toExecute: Function, options: WorkerOptionsDto): Promise<any> {
    const decorated = this.workerDecorator(toExecute, options);

    return decorated();
  }

  private static workerDecorator(toExecute: Function, options: WorkerOptionsDto): Function {
    return async (): Promise<any> => {
      const m = MeasurementHelper.startWithMessage(options.processName);
      try {
        return await toExecute.apply(
          this,
          // eslint-disable-next-line prefer-rest-params
          arguments,
        );
      } catch (error) {
        ConsoleHelper.logWorkerError(error);

        return null;
      } finally {
        await CloseHandlersHelper.closeDbConnections();

        m.printWithDurationChecking(options.processName, options.durationInSecondsToAlert);
      }
    };
  }
}

export = WorkerHelper;
