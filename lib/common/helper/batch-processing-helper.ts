/* eslint-disable no-console */
import { AppError } from '../../api/errors';
import { TotalParametersResponse } from '../interfaces/response-interfaces';

import EnvHelper = require('./env-helper');

class BatchProcessingHelper {
  public static async processWithBatch(
    fetchFunction: Function,
    countingFunction: Function,
    breakingFunction: Function,
    processingFunction: Function,

    limit: number,
    basicOffset: number = 0,
    errorIfNoFirstBatchData: boolean = true,
    overflowLimit: number = 1000000,
  ): Promise<TotalParametersResponse> {
    let offset = basicOffset;
    let counter = 0;
    let totalProcessedAmount = 0;

    let totalProcessedCounter = 0;
    let totalSkippedCounter = 0;

    if (EnvHelper.isNotTestEnv()) {
      console.log(`Let's start batch processing. Basic offset is: ${basicOffset}, limit is: ${limit}`);
    }

    do {
      const response: any = await fetchFunction(offset, limit);
      const counting = countingFunction(response);

      if (counting === 0 && counter === 0 && errorIfNoFirstBatchData) {
        const msg = 'There is no data for the first batch';
        console.error(msg);
        throw new AppError(msg);
      }

      if (breakingFunction(response)) {
        break;
      }


      totalProcessedAmount += counting;

      if (EnvHelper.isNotTestEnv()) {
        console.log(`Current fetched amount is: ${countingFunction(response)}. Current total amount is: ${totalProcessedAmount}`);
      }
      const { processedCounter, skippedCounter } = await processingFunction(response);

      totalProcessedCounter += processedCounter;
      totalSkippedCounter += skippedCounter;

      counter += 1;
      offset += limit;

      if (counter % 250 === 0) {
        console.log(`Current cycle is: ${counter}`);
      }

      if (counter > overflowLimit) {
        throw new AppError(`Batch cycle limiter is triggered. Already processed: ${counter}`);
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    if (EnvHelper.isNotTestEnv()) {
      console.log(`Let's finish a cycle. Stats:
      number of cycles is: ${counter},
      total processed amount is: ${totalProcessedAmount},
      total processed counter is: ${totalProcessedCounter},
      total skipped counter is: ${totalSkippedCounter},
    `);
    }

    return {
      totalProcessedCounter,
      totalSkippedCounter,
    };
  }
}

export = BatchProcessingHelper;
