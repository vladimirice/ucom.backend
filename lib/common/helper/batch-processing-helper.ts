import { AppError } from '../../api/errors';

class BatchProcessingHelper {
  public static async processWithBatch(
    fetchFunction: Function,
    breakingFunction: Function,
    processingFunction: Function,
    limit: number,
    basicOffset: number = 0,
    overflowLimit: number = 1000000,
  ): Promise<any> {
    let offset = basicOffset;
    let counter = 0;
    do {
      const response: any = await fetchFunction(offset, limit);
      if (breakingFunction(response)) {
        break;
      }

      await processingFunction(response);

      offset += limit;
      counter += 1;

      if (counter > overflowLimit) {
        throw new AppError('Batch cycle limiter is triggered');
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }
}

export = BatchProcessingHelper;
