import { injectable, multiInject } from 'inversify';
import 'reflect-metadata';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';
import { TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';

import { WorkerLogger } from '../../../config/winston';
import { MalformedProcessingError, UnableToProcessError } from '../trace-processors/processor-errors';

@injectable()
class BlockchainTracesProcessorChain {
  private readonly manyProcessors: TraceProcessor[];

  public constructor(
    @multiInject(BlockchainTracesDiTypes.tracesProcessor) manyProcessors: TraceProcessor[],
  ) {
    this.manyProcessors = manyProcessors;
  }

  public processChain(trace: ITrace): IProcessedTrace | null {
    for (const processor of this.manyProcessors) {
      let processedTrace;
      try {
        processedTrace = processor.processTrace(trace);
      } catch (error) {
        if (error instanceof UnableToProcessError) {
          continue;
        } else if (error instanceof MalformedProcessingError) {
          WorkerLogger.warn(error.message, {
            service: 'blockchain-traces-processor-chain',
            error,
            trace,
          });

          continue;
        }

        throw error;
      }

      return processedTrace;
    }

    return null;
  }
}

export = BlockchainTracesProcessorChain;
